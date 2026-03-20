from ultralytics import YOLO
import os

def check():
    path = 'best.pt' if os.path.exists('best.pt') else 'yolov8n.pt'
    model = YOLO(path)
    print(f"Model {path} names:", model.names)

if __name__ == "__main__":
    check()
