# -*- coding: utf-8 -*-
import os
import sys
import numpy as np
import cv2
import base64
from io import BytesIO
from PIL import Image
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, Flatten, Conv2D, MaxPooling2D

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables
model = None
emotion_dict = {0: "Angry", 1: "Disgusted", 2: "Fearful", 3: "Happy", 4: "Neutral", 5: "Sad", 6: "Surprised"}
face_cascade = None

def create_model():
    """Create the CNN model architecture"""
    model = Sequential()

    model.add(Conv2D(32, kernel_size=(3, 3), activation='relu', input_shape=(48,48,1)))
    model.add(Conv2D(64, kernel_size=(3, 3), activation='relu'))
    model.add(MaxPooling2D(pool_size=(2, 2)))
    model.add(Dropout(0.25))

    model.add(Conv2D(128, kernel_size=(3, 3), activation='relu'))
    model.add(MaxPooling2D(pool_size=(2, 2)))
    model.add(Conv2D(128, kernel_size=(3, 3), activation='relu'))
    model.add(MaxPooling2D(pool_size=(2, 2)))
    model.add(Dropout(0.25))

    model.add(Flatten())
    model.add(Dense(1024, activation='relu'))
    model.add(Dropout(0.5))
    model.add(Dense(7, activation='softmax'))
    
    return model

def load_model_and_cascade():
    """Load the trained model and face cascade"""
    global model, face_cascade
    try:
        # Create model architecture
        model = create_model()
        
        # Load weights
        model.load_weights('assets/models/model.h5')
        print("✅ Model weights loaded successfully")
        
        # Load face cascade
        cascade_path = 'assets/models/haarcascade_frontalface_default.xml'
        if os.path.exists(cascade_path):
            face_cascade = cv2.CascadeClassifier(cascade_path)
            print("✅ Face cascade loaded successfully")
        else:
            print("⚠️ Face cascade not found, using OpenCV default")
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        return True
    except Exception as e:
        print(f"❌ Error loading model or cascade: {e}")
        return False

def preprocess_face(face_image):
    """Preprocess face image for model prediction"""
    try:
        # Resize to 48x48 and convert to grayscale if needed
        if len(face_image.shape) == 3:
            face_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
        
        face_image = cv2.resize(face_image, (48, 48))
        
        # Normalize pixel values
        face_image = face_image.astype('float32') / 255.0
        
        # Reshape for model input (1, 48, 48, 1)
        face_image = np.expand_dims(face_image, axis=0)
        face_image = np.expand_dims(face_image, axis=-1)
        
        return face_image
    except Exception as e:
        print(f"Error preprocessing face: {e}")
        return None

def base64_to_image(base64_string):
    """Convert base64 string to OpenCV image"""
    try:
        # Remove data URL prefix if present
        if 'data:image' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image then to OpenCV
        pil_image = Image.open(BytesIO(image_data))
        opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        
        return opencv_image
    except Exception as e:
        print(f"Error converting base64 to image: {e}")
        return None

@app.route('/')
def index():
    """Serve the main HTML file"""
    return send_from_directory('.', 'index.html')

@app.route('/assets/<path:filename>')
def assets(filename):
    """Serve static assets"""
    return send_from_directory('assets', filename)

@app.route('/predict', methods=['POST'])
def predict_emotion():
    """Predict emotion from uploaded image"""
    try:
        if model is None or face_cascade is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Convert base64 to image
        image = base64_to_image(data['image'])
        if image is None:
            return jsonify({'error': 'Invalid image data'}), 400
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)
        
        if len(faces) == 0:
            return jsonify({
                'faces_detected': 0,
                'emotions': [],
                'message': 'No face detected'
            })
        
        results = []
        for (x, y, w, h) in faces:
            # Extract face region
            face_roi = gray[y:y + h, x:x + w]
            
            # Preprocess face for model
            processed_face = preprocess_face(face_roi)
            if processed_face is None:
                continue
            
            # Predict emotion
            prediction = model.predict(processed_face, verbose=0)
            emotion_probabilities = prediction[0]
            
            # Get emotion results
            emotion_results = {}
            for i, emotion_name in emotion_dict.items():
                emotion_results[emotion_name.lower()] = float(emotion_probabilities[i])
            
            # Get max emotion
            max_emotion_index = np.argmax(emotion_probabilities)
            max_emotion = emotion_dict[max_emotion_index]
            max_confidence = float(emotion_probabilities[max_emotion_index])
            
            results.append({
                'face_position': {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)},
                'max_emotion': max_emotion.lower(),
                'max_confidence': max_confidence,
                'all_emotions': emotion_results
            })
        
        return jsonify({
            'faces_detected': len(faces),
            'emotions': results,
            'message': 'Success'
        })
        
    except Exception as e:
        print(f"Error in prediction: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'cascade_loaded': face_cascade is not None
    })

if __name__ == '__main__':
    print("🚀 Starting CheckyCheck Emotion Detection Server...")
    
    # Load model and cascade
    if load_model_and_cascade():
        print("🎭 All components loaded successfully!")
        print("🌐 Starting Flask server on http://localhost:5000")
        print("📱 Open your browser and go to http://localhost:5000")
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("❌ Failed to load required components. Exiting...")
        sys.exit(1)
