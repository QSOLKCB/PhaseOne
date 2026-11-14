/* Copyright 2026 QSOL-IMC. Apache-2.0. Portable, integer-only simulation. */
#include "phaseone.h"
/* Generated from round(sin(degrees) * 10000), degrees 0..90 inclusive.
 * Values are constants in both targets; the simulation performs NO FP math. */
static const int16_t sin_quadrant[91] = {
  0, 174, 349, 523, 698, 872, 1045, 1219, 1392, 1564,
  1736, 1908, 2079, 2250, 2419, 2588, 2756, 2924, 3090, 3256,
  3420, 3584, 3746, 3907, 4067, 4226, 4384, 4540, 4695, 4848,
  5000, 5150, 5299, 5446, 5592, 5736, 5878, 6018, 6157, 6293,
  6428, 6561, 6691, 6820, 6947, 7071, 7193, 7314, 7431, 7547,
  7660, 7771, 7880, 7986, 8090, 8192, 8290, 8387, 8480, 8572,
  8660, 8746, 8829, 8910, 8988, 9063, 9135, 9205, 9272, 9336,
  9397, 9455, 9511, 9563, 9613, 9659, 9703, 9744, 9781, 9816,
  9848, 9877, 9903, 9925, 9945, 9962, 9976, 9986, 9994, 9998,
  10000,
};
static struct {
  uint32_t tick;
  int32_t x;
  int32_t z;
  int32_t yaw;
  int32_t pitch;
  uint32_t target_alive;
  uint32_t score;
} state;
static uint8_t input_host[P1_INPUT_SIZE];
static uint8_t output_host[P1_STATE_SIZE];
static void write_u32(uint8_t *out, uint32_t v) {
  out[0]=(uint8_t)v;
  out[1]=(uint8_t)(v>>8);
  out[2]=(uint8_t)(v>>16);
  out[3]=(uint8_t)(v>>24);
}
static int32_t clamp(int32_t v,int32_t lo,int32_t hi) {
  return v<lo?lo:(v>hi?hi:v);
}
static int32_t abs32(int32_t v) {return v<0?-v:v;}
static int32_t sin_degree(int32_t degree) {
  int32_t d=degree%360;
  if(d<0)d+=360;
  if(d<=90)return sin_quadrant[d];
  if(d<=180)return sin_quadrant[180-d];
  if(d<=270)return -sin_quadrant[d-180];
  return -sin_quadrant[360-d];
}
static int32_t sin_deci(int32_t ddeg) {
  int32_t d=ddeg%3600;
  if(d<0)d+=3600;
  int32_t whole=d/10;
  int32_t remainder=d%10;
  int32_t a=sin_degree(whole), b=sin_degree(whole+1);
  return a+(b-a)*remainder/10;
}
static int32_t cos_deci(int32_t ddeg) {return sin_deci(ddeg+900);}
static int32_t read_i16(const uint8_t *p) {
  uint32_t raw=(uint32_t)p[0]|((uint32_t)p[1]<<8);
  return raw>=32768u?(int32_t)raw-65536:(int32_t)raw;
}
static int collides(int32_t x,int32_t z) {
  return x>750 && x<2750 && z>-2250 && z<1250;
}
uint32_t phaseone_abi_version(void) {return P1_ABI_VERSION;}
int32_t phaseone_require_abi(uint32_t version) {
  return version==P1_ABI_VERSION?P1_OK:P1_ERR_VERSION;
}
int32_t phaseone_reset(uint32_t seed) {
  (void)seed;
  state.tick=0;
  state.x=0;
  state.z=4500;
  state.yaw=0;
  state.pitch=0;
  state.target_alive=1;
  state.score=0;
  return P1_OK;
}
int32_t phaseone_step(const uint8_t *record,uint32_t length) {
  if(!record)return P1_ERR_NULL;
  if(length!=P1_INPUT_SIZE)return P1_ERR_LENGTH;
  uint32_t flags=record[0];
  int32_t dyaw=read_i16(record+1), dpitch=read_i16(record+3);
  if((flags&~31u)||record[5]||record[6]||record[7]||
     abs32(dyaw)>300||abs32(dpitch)>300)return P1_ERR_RECORD;
  if(state.tick==0xffffffffu)return P1_ERR_RECORD;
  int32_t yaw=state.yaw+dyaw;
  yaw=((yaw+1800)%3600+3600)%3600-1800;
  state.yaw=yaw;
  state.pitch=clamp(state.pitch+dpitch,-800,800);
  int32_t forward=(int32_t)((flags&P1_FORWARD)!=0)-
                  (int32_t)((flags&P1_BACK)!=0);
  int32_t strafe=(int32_t)((flags&P1_RIGHT)!=0)-
                 (int32_t)((flags&P1_LEFT)!=0);
  int32_t step=forward&&strafe?71:100;
  int32_t sinyaw=sin_deci(yaw), cosyaw=cos_deci(yaw);
  int32_t dx=(forward*sinyaw+strafe*cosyaw)*step/10000;
  int32_t dz=(-forward*cosyaw+strafe*sinyaw)*step/10000;
  int32_t next_x=clamp(state.x+dx,-6250,6250);
  if(!collides(next_x,state.z))state.x=next_x;
  int32_t next_z=clamp(state.z+dz,-6250,6250);
  if(!collides(state.x,next_z))state.z=next_z;
  if((flags&P1_FIRE)&&state.target_alive) {
    int32_t tx=-state.x, tz=-4000-state.z;
    int32_t dot=tx*sinyaw-tz*cosyaw;
    int32_t cross=tx*cosyaw+tz*sinyaw;
    int32_t dist2=tx*tx+tz*tz;
    if(dot>0 && abs32(state.pitch)<=60 &&
       (int64_t)abs32(cross)*100<=(int64_t)dot*9 &&
       dist2<=100000000) {
      state.target_alive=0;
      state.score++;
    }
  }
  state.tick++;
  return P1_OK;
}
uint32_t phaseone_state_size(void) {return P1_STATE_SIZE;}
int32_t phaseone_serialize_state(uint8_t *out,uint32_t capacity) {
  if(!out)return P1_ERR_NULL;
  if(capacity<P1_STATE_SIZE)return P1_ERR_BUFFER;
  out[0]='P';out[1]='1';out[2]='S';out[3]='1';
  write_u32(out+4,state.tick);
  write_u32(out+8,(uint32_t)state.x);
  write_u32(out+12,(uint32_t)state.z);
  write_u32(out+16,(uint32_t)state.yaw);
  write_u32(out+20,(uint32_t)state.pitch);
  write_u32(out+24,state.target_alive);
  write_u32(out+28,state.score);
  return P1_OK;
}
uint32_t phaseone_input_ptr(void) {return (uint32_t)(uintptr_t)input_host;}
uint32_t phaseone_state_ptr(void) {return (uint32_t)(uintptr_t)output_host;}
