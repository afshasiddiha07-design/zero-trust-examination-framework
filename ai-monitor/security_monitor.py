import cv2
import requests
import time
from ultralytics import YOLO

# Backend configuration
BACKEND_URL = "http://127.0.0.1:8000"
MONITOR_KEY = "change-this-monitor-key"

# Detection configuration
PHONE_CONFIDENCE_THRESHOLD = 0.40
ALERT_COOLDOWN = 5

last_alert_time = 0

# Load YOLO model
model = YOLO("yolo11n.pt")

# Open webcam
camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("Could not open webcam")
    exit()

print("Security monitor started.")
print("Press Q to stop.")

while True:

    success, frame = camera.read()

    if not success:
        print("Could not read frame")
        break

    # Run YOLO object detection
    results = model(frame, verbose=False)

    for result in results:

        for box in result.boxes:

            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            class_name = model.names[class_id]

            # Get bounding-box coordinates
            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0]
            )

            # Draw bounding box for detected objects
            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                (0, 255, 0),
                2
            )

            # Display detected class and confidence
            cv2.putText(
                frame,
                f"{class_name} {confidence:.2f}",
                (x1, max(y1 - 10, 20)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2
            )

            # Check specifically for a phone
            if (
                class_name == "cell phone"
                and confidence >= PHONE_CONFIDENCE_THRESHOLD
                and time.time() - last_alert_time >= ALERT_COOLDOWN
            ):

                print(
                    f"SECURITY ALERT: Cell phone detected "
                    f"({confidence:.2f})"
                )

                try:

                    response = requests.post(
                        f"{BACKEND_URL}/security/incidents",
                        headers={
                            "x-monitor-key": MONITOR_KEY
                        },
                        json={
                            "incident_type": "PHONE_DETECTED",
                            "confidence": confidence,
                            "source": "AI_SECURITY_MONITOR"
                        },
                        timeout=5
                    )

                    if response.status_code == 200:

                        print(
                            "Incident sent to backend successfully."
                        )

                        # Start cooldown only after
                        # successful backend recording.
                        last_alert_time = time.time()

                    else:

                        print(
                            f"Backend rejected incident: "
                            f"{response.status_code}"
                        )

                except requests.RequestException as error:

                    print(
                        "Could not send incident to backend: "
                        f"{error}"
                    )

                # Display security warning
                cv2.putText(
                    frame,
                    "SECURITY ALERT: PHONE DETECTED",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 0, 255),
                    2
                )

    # Display webcam
    cv2.imshow(
        "Zero-Trust Security Monitor",
        frame
    )

    # Press Q to stop
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


# Cleanup
camera.release()
cv2.destroyAllWindows()

print("Security monitor stopped.")