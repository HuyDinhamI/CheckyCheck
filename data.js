// Dữ liệu bài hát xẩm mẫu
const songData = {
    title: "XẨM THẬP ÂN - CÔNG CHA NGÃI MẸ SINH THÀNH",
    segments: [
        {
            id: 1,
            text: "Ngãi mẹ sinh thành chớ có (ó) quên\ncông cha ngãi (ãi) mẹ sinh thành\nMẹ mang con vào tháng ớ\nThai (i) sinh một giờ\nỞ trong lòng mẹ cha(ả)\nsợ tanh Ho (i ơ )\n\nTrong mấy (í) xin mẹ\nchả(ả) chắn (i) tanh nhớ (ơ)\nKeep con từ thư mở\nnước ngây thơ như là\nChớ con quên công cha (mà)\nmà ngãi(í) mẹ sinh con ra",
            order: 1,
            audioFile: "XẨM THẬP ÂN - CÔNG CHA NGÃI MẸ SINH THÀNH - ver1.mp3"
        },
        {
            id: 2, 
            text: "Công mẹ (ẹ) cũng lắm công\ncha thờ nhiều lần là khi (ớ con ơ) bồng bềnh\nbầu vú có sữa nâng niu (ơ)\n\nNửa mấy khi (ớ) bồng bềnh, bồng bềnh (ế) nâng niu\nSinh con (mấy) trai con gái\nCông lao cha mẹ (thì) khai quang\nchả (mấy) cho đêm ngày (thì) cho con\nbún ăn",
            order: 2,
            audioFile: "XẨM THẬP ÂN - CÔNG CHA NGÃI MẸ SINH THÀNH - ver2.mp3"
        },
        {
            id: 3,
            text: "Đêm nằm quần áo\nChiếc chăn nó ướt đầm lầy\n\nchỗ ướt (ơ) thời mẹ chịu cho tâm yên(ư)\n\nƯớt mấy (thời) mẹ .chịu nản tâm\nmau (nhận í) xê lại con\nnằm ở chỗ êm,\nĐốt ngọn đèn(con ơi) thông(ư) thu cả đêm\n\nChờ đợi, cho con đi ngủ ấm\nmẹ nằm mong mấy ngày con ơi\n(thì) mong tháng đủ, mà đầy năm.",
            order: 3,
            audioFile: "XẨM THẬP ÂN - CÔNG CHA NGÃI MẸ SINH THÀNH - ver3.mp3"
        }

    ],
    
    // Hàm trộn ngẫu nhiên thứ tự segments
    getShuffledSegments: function() {
        const shuffled = [...this.segments];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },
    
    // Hàm lấy thứ tự đúng
    getCorrectOrder: function() {
        return this.segments.map(segment => segment.order).sort((a, b) => a - b);
    },
    
    // Hàm kiểm tra thứ tự
    checkOrder: function(userOrder) {
        const correctOrder = this.getCorrectOrder();
        return JSON.stringify(correctOrder) === JSON.stringify(userOrder);
    }
};

// Dữ liệu audio giả lập (sẽ tạo audio động)
const audioConfig = {
    // Tần số cho mỗi đoạn (Hz) - để tạo âm thanh khác nhau
    frequencies: {
        1: [523.25, 587.33, 659.25], // C5, D5, E5
        2: [698.46, 783.99, 880.00], // F5, G5, A5  
        3: [987.77, 1046.50, 1174.66] // B5, C6, D6
    },
    
    duration: 2.5, // độ dài mỗi segment (giây)
    
    // Tạo âm thanh cho segment
    createTone: function(segmentId) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const frequencies = this.frequencies[segmentId];
        const duration = this.duration;
        
        // Tạo buffer
        const buffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Tạo âm thanh phức tạp (hòa âm)
        for (let i = 0; i < data.length; i++) {
            const time = i / audioContext.sampleRate;
            let sample = 0;
            
            // Kết hợp nhiều tần số để tạo âm thanh hay hơn
            frequencies.forEach((freq, index) => {
                const amplitude = 0.3 / (index + 1); // giảm dần amplitude
                sample += amplitude * Math.sin(2 * Math.PI * freq * time);
            });
            
            // Thêm envelope để âm thanh mượt hơn
            const envelope = Math.sin(Math.PI * time / duration);
            data[i] = sample * envelope * 0.5;
        }
        
        return buffer;
    },
    
    // Phát audio cho segment
    playSegment: function(segmentId, onEnded) {
        const segment = songData.segments.find(seg => seg.id === segmentId);
        if (!segment || !segment.audioFile) {
            console.warn('Không tìm thấy audio cho segmentId:', segmentId);
            if (onEnded) onEnded();
            return;
        }

        const audio = new Audio(segment.audioFile);
        audio.onended = onEnded;
        audio.play();
        
        return audio;
    }
    ,
    
    // Phát chuỗi audio theo thứ tự
    playSequence: function(segmentIds, onComplete) {
        let currentIndex = 0;
        
        const playNext = () => {
            if (currentIndex >= segmentIds.length) {
                if (onComplete) onComplete();
                return;
            }
            
            const segmentId = segmentIds[currentIndex];
            currentIndex++;
            
            // Highlight segment đang phát
            this.highlightPlayingSegment(segmentId);
            
            this.playSegment(segmentId, () => {
                // Xóa highlight
                this.removeHighlight(segmentId);
                
                // Delay ngắn giữa các segment
                setTimeout(playNext, 300);
            });
        };
        
        playNext();
    },
    
    // Highlight segment đang phát
    highlightPlayingSegment: function(segmentId) {
        // Tìm segment trong drop zones
        const dropZones = document.querySelectorAll('.drop-content');
        dropZones.forEach(zone => {
            const segment = zone.querySelector('.segment');
            if (segment && parseInt(segment.dataset.segmentId) === segmentId) {
                segment.classList.add('playing-audio');
            }
        });
    },
    
    // Xóa highlight
    removeHighlight: function(segmentId) {
        const segments = document.querySelectorAll('.segment');
        segments.forEach(segment => {
            segment.classList.remove('playing-audio');
        });
    }
};

// Export để sử dụng trong script.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { songData, audioConfig };
}
