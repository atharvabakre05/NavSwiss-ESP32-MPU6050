#include "Wire.h"
#include "MPU6050_6Axis_MotionApps20.h"

MPU6050 mpu1(0x68);   // MPU #1
MPU6050 mpu2(0x69);   // MPU #2

bool dmpReady1 = false;
bool dmpReady2 = false;

uint16_t packetSize1, packetSize2;
uint8_t fifoBuffer1[64];
uint8_t fifoBuffer2[64];

Quaternion q1, q2;
VectorFloat gravity1, gravity2;
float ypr1[3], ypr2[3];

void setup() {
  Serial.begin(115200);
  Wire.begin();

  Serial.println("Initializing MPU1 (0x68)...");
  mpu1.initialize();
  if (mpu1.dmpInitialize() == 0) {
    mpu1.setDMPEnabled(true);
    packetSize1 = mpu1.dmpGetFIFOPacketSize();
    dmpReady1 = true;
    Serial.println("MPU1 READY");
  } else Serial.println("MPU1 FAILED!");

  Serial.println("Initializing MPU2 (0x69)...");
  mpu2.initialize();
  if (mpu2.dmpInitialize() == 0) {
    mpu2.setDMPEnabled(true);
    packetSize2 = mpu2.dmpGetFIFOPacketSize();
    dmpReady2 = true;
    Serial.println("MPU2 READY");
  } else Serial.println("MPU2 FAILED!");
}

void loop() {

  // ============================ MPU 1 ============================
  if (dmpReady1 && mpu1.getFIFOCount() >= packetSize1) {
    mpu1.getFIFOBytes(fifoBuffer1, packetSize1);

    mpu1.dmpGetQuaternion(&q1, fifoBuffer1);
    mpu1.dmpGetGravity(&gravity1, &q1);
    mpu1.dmpGetYawPitchRoll(ypr1, &q1, &gravity1);

    int16_t ax1, ay1, az1, gx1, gy1, gz1;
    mpu1.getAcceleration(&ax1, &ay1, &az1);
    mpu1.getRotation(&gx1, &gy1, &gz1);

    Serial.println("\n===== MPU1 (0x68) =====");
    Serial.printf("Accel XYZ: %d, %d, %d\n", ax1, ay1, az1);
    Serial.printf("Gyro  XYZ: %d, %d, %d\n", gx1, gy1, gz1);
    Serial.printf("Yaw: %.2f  Pitch: %.2f  Roll: %.2f\n",
                  ypr1[0] * 180 / M_PI,
                  ypr1[1] * 180 / M_PI,
                  ypr1[2] * 180 / M_PI);
  }


  // ============================ MPU 2 ============================
  if (dmpReady2 && mpu2.getFIFOCount() >= packetSize2) {
    mpu2.getFIFOBytes(fifoBuffer2, packetSize2);

    mpu2.dmpGetQuaternion(&q2, fifoBuffer2);
    mpu2.dmpGetGravity(&gravity2, &q2);
    mpu2.dmpGetYawPitchRoll(ypr2, &q2, &gravity2);

    int16_t ax2, ay2, az2, gx2, gy2, gz2;
    mpu2.getAcceleration(&ax2, &ay2, &az2);
    mpu2.getRotation(&gx2, &gy2, &gz2);

    Serial.println("\n===== MPU2 (0x69) =====");
    Serial.printf("Accel XYZ: %d, %d, %d\n", ax2, ay2, az2);
    Serial.printf("Gyro  XYZ: %d, %d, %d\n", gx2, gy2, gz2);
    Serial.printf("Yaw: %.2f  Pitch: %.2f  Roll: %.2f\n",
                  ypr2[0] * 180 / M_PI,
                  ypr2[1] * 180 / M_PI,
                  ypr2[2] * 180 / M_PI);
  }

  delay(1000);
}
