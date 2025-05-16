# backend/emotion_detector.py
import cv2
import mediapipe as mp
import math
import numpy as np
import time # Có thể không cần time trong module này
import warnings
from PIL import Image

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms

# --- Định nghĩa các lớp Model (Bottleneck, Conv2dSame, ResNet, LSTMPyTorch) ---
# (Sẽ sao chép từ main.py vào đây)

# --- Các hàm xử lý (pth_processing, norm_coordinates, get_box) ---
# (Sẽ sao chép từ main.py vào đây)

# --- Biến toàn cục hoặc class để giữ model đã tải ---
# pth_backbone_model = None
# pth_LSTM_model = None
# mp_face_mesh = None
# DICT_EMO = {0: 'Neutral', 1: 'Happiness', 2: 'Sadness', 3: 'Surprise', 4: 'Fear', 5: 'Disgust', 6: 'Anger'}
# lstm_features_global = [] # Cần quản lý cẩn thận nếu dùng global cho stateful LSTM

class EmotionDetector:
    def __init__(self, backbone_model_path, lstm_model_path_template, lstm_model_name="Aff-Wild2"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Định nghĩa các lớp Model (Bottleneck, Conv2dSame, ResNet, LSTMPyTorch) ngay trong __init__ hoặc import từ nơi khác
        # Ví dụ: self.Bottleneck = Bottleneck 
        # (Cần đảm bảo các lớp này được định nghĩa trước khi sử dụng)
        
        # Kiểm tra xem các file mô hình có tồn tại không
        import os
        if not os.path.exists(backbone_model_path):
            raise FileNotFoundError(f"Không tìm thấy file mô hình ResNet50 tại: {backbone_model_path}")
        
        lstm_full_path = lstm_model_path_template.format(lstm_model_name)
        if not os.path.exists(lstm_full_path):
            raise FileNotFoundError(f"Không tìm thấy file mô hình LSTM tại: {lstm_full_path}")
            
        print(f"Tải mô hình ResNet50 từ: {backbone_model_path}")
        print(f"Tải mô hình LSTM từ: {lstm_full_path}")
            
        # Tải ResNet50 (giống hệt với main.py)
        self.pth_backbone_model = ResNet50(7, channels=3)
        self.pth_backbone_model.load_state_dict(torch.load(backbone_model_path, weights_only = False))
        self.pth_backbone_model.to(self.device)
        self.pth_backbone_model.eval()

        # Tải LSTM (giống hệt với main.py)
        self.pth_LSTM_model = LSTMPyTorch()
        self.pth_LSTM_model.load_state_dict(torch.load(lstm_full_path))
        self.pth_LSTM_model.to(self.device)
        self.pth_LSTM_model.eval()

        # Khởi tạo MediaPipe FaceMesh
        self.mp_face_mesh = mp.solutions.face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

        self.DICT_EMO = {0: 'Neutral', 1: 'Happiness', 2: 'Sadness', 3: 'Surprise', 4: 'Fear', 5: 'Disgust', 6: 'Anger'}
        self.lstm_features_buffer = [] # Buffer cho mỗi instance của detector

        # Hàm PreprocessInput cho PyTorch
        class PreprocessInput(torch.nn.Module):
            def __init__(self): # Sửa init thành __init__
                super(PreprocessInput, self).__init__()

            def forward(self, x):
                x = x.to(torch.float32)
                x = torch.flip(x, dims=(0,)) # Trong main.py là dims=(0,), không phải (2,)
                # Các giá trị mean này có thể cần được kiểm tra lại hoặc truyền vào như tham số
                x[0, :, :] -= 91.4953
                x[1, :, :] -= 103.8827
                x[2, :, :] -= 131.0912
                return x
        
        self.torch_transform = transforms.Compose([
            transforms.PILToTensor(),
            PreprocessInput()
        ])
        
        warnings.simplefilter("ignore", UserWarning)
        print("EmotionDetector initialized.")


    def _pth_processing(self, pil_image):
        # img_pil: đối tượng ảnh PIL
        img = pil_image.resize((224, 224), Image.Resampling.NEAREST)
        img_tensor = self.torch_transform(img)
        img_tensor = torch.unsqueeze(img_tensor, 0)
        return img_tensor.to(self.device)

    def _norm_coordinates(self, normalized_x, normalized_y, image_width, image_height):
        x_px = min(math.floor(normalized_x * image_width), image_width - 1)
        y_px = min(math.floor(normalized_y * image_height), image_height - 1)
        return x_px, y_px

    def _get_box_from_landmarks(self, face_landmarks, image_width, image_height):
        idx_to_coors = {}
        for idx, landmark in enumerate(face_landmarks.landmark):
            landmark_px = self._norm_coordinates(landmark.x, landmark.y, image_width, image_height)
            if landmark_px:
                idx_to_coors[idx] = landmark_px
        
        if not idx_to_coors:
            return None

        x_min = np.min(np.asarray(list(idx_to_coors.values()))[:,0])
        y_min = np.min(np.asarray(list(idx_to_coors.values()))[:,1])
        endX = np.max(np.asarray(list(idx_to_coors.values()))[:,0])
        endY = np.max(np.asarray(list(idx_to_coors.values()))[:,1])

        startX = max(0, int(x_min))
        startY = max(0, int(y_min))
        endX = min(image_width - 1, int(endX))
        endY = min(image_height - 1, int(endY))
        
        return startX, startY, endX, endY

    def detect_emotion_from_image(self, frame_pil):
        """
        Phân tích cảm xúc từ một hình ảnh đầu vào.
        
        Args:
            frame_pil: Đối tượng PIL Image chứa hình ảnh cần phân tích
            
        Returns:
            detected_emotion: Tên của cảm xúc nhận diện được
            confidence: Độ tin cậy của dự đoán (0.0 đến 1.0)
            face_box: Tọa độ của khuôn mặt dưới dạng (startX, startY, endX, endY) hoặc None nếu không phát hiện được khuôn mặt
        """
        
        # Chuyển PIL Image sang NumPy array để MediaPipe xử lý
        frame_np = np.array(frame_pil.convert('RGB')) # Đảm bảo là RGB
        h, w, _ = frame_np.shape

        # MediaPipe xử lý
        frame_np.flags.writeable = False
        results = self.mp_face_mesh.process(frame_np)
        frame_np.flags.writeable = True

        detected_emotion = "N/A"
        confidence = 0.0
        face_box = None

        if results.multi_face_landmarks:
            for fl in results.multi_face_landmarks: # Giả sử chỉ xử lý 1 khuôn mặt
                box = self._get_box_from_landmarks(fl, w, h)
                if box is None or (box[2]-box[0] <= 0) or (box[3]-box[1] <= 0):
                    continue
                
                startX, startY, endX, endY = box
                face_box = (startX, startY, endX, endY)
                cur_face_pil = frame_pil.crop((startX, startY, endX, endY))
                
                cur_face_tensor = self._pth_processing(cur_face_pil)
                
                with torch.no_grad():
                    features = torch.nn.functional.relu(self.pth_backbone_model.extract_features(cur_face_tensor)).cpu().numpy()

                    if len(self.lstm_features_buffer) == 0:
                        self.lstm_features_buffer = [features] * 10
                    else:
                        self.lstm_features_buffer = self.lstm_features_buffer[1:] + [features]

                    lstm_f_np = np.vstack(self.lstm_features_buffer)
                    lstm_f_tensor = torch.from_numpy(lstm_f_np).unsqueeze(0).to(self.device)
                    
                    output = self.pth_LSTM_model(lstm_f_tensor).cpu().numpy()
            
                cl = np.argmax(output)
                detected_emotion = self.DICT_EMO[cl]
                confidence = float(output[0][cl])
                break # Chỉ xử lý khuôn mặt đầu tiên tìm thấy

        return detected_emotion, confidence, face_box

# Hàm khởi tạo toàn cục (nếu không dùng class)
# def initialize_models(backbone_path, lstm_template, lstm_name="Aff-Wild2"):
#     global pth_backbone_model, pth_LSTM_model, mp_face_mesh, lstm_features_global
    # ... tải model ...
#     print("Models initialized globally.")

# def detect_emotion_global(frame_pil):
    # ... sử dụng model toàn cục ...
#     pass

# --- Các lớp Model và hàm tạo Model ---
class Bottleneck(nn.Module):
    expansion = 4
    def __init__(self, in_channels, out_channels, i_downsample=None, stride=1):
        super(Bottleneck, self).__init__()
        
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=stride, padding=0, bias=False)
        self.batch_norm1 = nn.BatchNorm2d(out_channels, eps=0.001, momentum=0.99)
        
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3, padding='same', bias=False)
        self.batch_norm2 = nn.BatchNorm2d(out_channels, eps=0.001, momentum=0.99)
        
        self.conv3 = nn.Conv2d(out_channels, out_channels*self.expansion, kernel_size=1, stride=1, padding=0, bias=False)
        self.batch_norm3 = nn.BatchNorm2d(out_channels*self.expansion, eps=0.001, momentum=0.99)
        
        self.i_downsample = i_downsample
        self.stride = stride
        self.relu = nn.ReLU()
        
    def forward(self, x):
        identity = x.clone()
        x = self.relu(self.batch_norm1(self.conv1(x)))
        
        x = self.relu(self.batch_norm2(self.conv2(x)))
        
        x = self.conv3(x)
        x = self.batch_norm3(x)
        
        #downsample if needed
        if self.i_downsample is not None:
            identity = self.i_downsample(identity)
        #add identity
        x+=identity
        x=self.relu(x)
        
        return x

class Conv2dSame(torch.nn.Conv2d):

    def calc_same_pad(self, i: int, k: int, s: int, d: int) -> int:
        return max((math.ceil(i / s) - 1) * s + (k - 1) * d + 1 - i, 0)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        ih, iw = x.size()[-2:]

        pad_h = self.calc_same_pad(i=ih, k=self.kernel_size[0], s=self.stride[0], d=self.dilation[0])
        pad_w = self.calc_same_pad(i=iw, k=self.kernel_size[1], s=self.stride[1], d=self.dilation[1])

        if pad_h > 0 or pad_w > 0:
            x = F.pad(
                x, [pad_w // 2, pad_w - pad_w // 2, pad_h // 2, pad_h - pad_h // 2]
            )
        return F.conv2d(
            x,
            self.weight,
            self.bias,
            self.stride,
            self.padding,
            self.dilation,
            self.groups,
        )

class ResNet(nn.Module):
    def __init__(self, ResBlock, layer_list, num_classes, num_channels=3):
        super(ResNet, self).__init__()
        self.in_channels = 64

        self.conv_layer_s2_same = Conv2dSame(num_channels, 64, 7, stride=2, groups=1, bias=False)
        self.batch_norm1 = nn.BatchNorm2d(64, eps=0.001, momentum=0.99)
        self.relu = nn.ReLU()
        self.max_pool = nn.MaxPool2d(kernel_size = 3, stride=2)
        
        self.layer1 = self._make_layer(ResBlock, layer_list[0], planes=64, stride=1)
        self.layer2 = self._make_layer(ResBlock, layer_list[1], planes=128, stride=2)
        self.layer3 = self._make_layer(ResBlock, layer_list[2], planes=256, stride=2)
        self.layer4 = self._make_layer(ResBlock, layer_list[3], planes=512, stride=2)
        
        self.avgpool = nn.AdaptiveAvgPool2d((1,1))
        self.fc1 = nn.Linear(512*ResBlock.expansion, 512)
        self.relu1 = nn.ReLU()
        self.fc2 = nn.Linear(512, num_classes)

    def extract_features(self, x):
        x = self.relu(self.batch_norm1(self.conv_layer_s2_same(x)))
        x = self.max_pool(x)
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        
        x = self.avgpool(x)
        x = x.reshape(x.shape[0], -1)
        x = self.fc1(x)
        return x
        
    def forward(self, x):
        x = self.extract_features(x)
        x = self.relu1(x)
        x = self.fc2(x)
        return x
        
    def _make_layer(self, ResBlock, blocks, planes, stride=1):
        ii_downsample = None
        layers = []
        
        if stride != 1 or self.in_channels != planes*ResBlock.expansion:
            ii_downsample = nn.Sequential(
                nn.Conv2d(self.in_channels, planes*ResBlock.expansion, kernel_size=1, stride=stride, bias=False, padding=0),
                nn.BatchNorm2d(planes*ResBlock.expansion, eps=0.001, momentum=0.99)
            )
            
        layers.append(ResBlock(self.in_channels, planes, i_downsample=ii_downsample, stride=stride))
        self.in_channels = planes*ResBlock.expansion
        
        for i in range(blocks-1):
            layers.append(ResBlock(self.in_channels, planes))
            
        return nn.Sequential(*layers)
        
def ResNet50(num_classes, channels=3):
    return ResNet(Bottleneck, [3,4,6,3], num_classes, channels)

class LSTMPyTorch(nn.Module):
    def __init__(self):
        super(LSTMPyTorch, self).__init__()
        
        self.lstm1 = nn.LSTM(input_size=512, hidden_size=512, batch_first=True, bidirectional=False)
        self.lstm2 = nn.LSTM(input_size=512, hidden_size=256, batch_first=True, bidirectional=False)
        self.fc = nn.Linear(256, 7)
        self.softmax = nn.Softmax(dim=1)

    def forward(self, x):
        x, _ = self.lstm1(x)
        x, _ = self.lstm2(x)        
        x = self.fc(x[:, -1, :])
        x = self.softmax(x)
        return x

if __name__ == '__main__':
    # Đây là phần để test module emotion_detector.py độc lập
    # Ví dụ:
    # detector = EmotionDetector(
    #     backbone_model_path="models/FER_static_ResNet50_AffectNet.pt", # Đường dẫn tương đối từ backend/
    #     lstm_model_path_template="models/FER_dinamic_LSTM_{0}.pt",
    #     lstm_model_name="Aff-Wild2"
    # )
    
    # Mở một ảnh mẫu
    # try:
    #     sample_image = Image.open("path_to_sample_image.jpg") # Thay bằng đường dẫn ảnh thật
    #     emotion, conf, box = detector.detect_emotion_from_image(sample_image)
    #     print(f"Detected: {emotion}, Confidence: {conf:.2f}, Box: {box}")
    # except FileNotFoundError:
    #     print("Sample image not found. Please provide a valid path for testing.")
    # except Exception as e:
    #     print(f"An error occurred during testing: {e}")
    pass
