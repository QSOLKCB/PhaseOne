/* Copyright 2026 QSOL-IMC. Apache-2.0. Native headless replay. */
#include "../core/phaseone.h"
#include <stdio.h>
#include <stdint.h>
#include <string.h>
static uint32_t u32(const uint8_t *p) {
  return (uint32_t)p[0]|((uint32_t)p[1]<<8)|
         ((uint32_t)p[2]<<16)|((uint32_t)p[3]<<24);
}
static int selftest(void) {
  uint8_t state[32],in[8]={0};
  if(phaseone_abi_version()!=1||phaseone_require_abi(2)!=P1_ERR_VERSION||
     phaseone_reset(0)!=0||phaseone_step(NULL,8)!=P1_ERR_NULL||
     phaseone_step(in,0)!=P1_ERR_LENGTH||
     phaseone_serialize_state(state,31)!=P1_ERR_BUFFER||
     phaseone_serialize_state(NULL,32)!=P1_ERR_NULL)return 1;
  in[0]=0x80;
  if(phaseone_step(in,8)!=P1_ERR_RECORD)return 2;
  in[0]=0;in[5]=1;
  if(phaseone_step(in,8)!=P1_ERR_RECORD)return 3;
  in[5]=0;
  if(phaseone_step(in,8)!=0||phaseone_serialize_state(state,32)!=0||u32(state+4)!=1)return 4;
  if(phaseone_reset(0)!=0||phaseone_serialize_state(state,32)!=0||u32(state+4)!=0)return 5;
  in[0]=P1_FIRE;in[1]=100;
  if(phaseone_step(in,8)!=0||phaseone_serialize_state(state,32)!=0||u32(state+28)!=0)return 6;
  in[1]=156;in[2]=255;
  if(phaseone_step(in,8)!=0||phaseone_serialize_state(state,32)!=0||
     u32(state+28)!=1||u32(state+24)!=0)return 7;
  in[1]=0;in[2]=0;
  if(phaseone_step(in,8)!=0||phaseone_serialize_state(state,32)!=0||u32(state+28)!=1)return 8;
  if(phaseone_reset(0)!=0)return 9;
  in[0]=P1_FORWARD;
  for(int i=0;i<40;i++)if(phaseone_step(in,8)!=0)return 10;
  in[0]=P1_RIGHT;
  for(int i=0;i<10;i++)if(phaseone_step(in,8)!=0)return 11;
  if(phaseone_serialize_state(state,32)!=0||u32(state+8)!=700u||u32(state+12)!=500u)return 12;
  if(phaseone_reset(0)!=0)return 13;
  in[0]=P1_BACK;
  for(int i=0;i<200;i++)if(phaseone_step(in,8)!=0)return 14;
  if(phaseone_serialize_state(state,32)!=0||u32(state+12)!=6250u)return 15;
  if(phaseone_reset(0)!=0)return 16;
  in[0]=0;in[3]=44;in[4]=1;
  for(int i=0;i<4;i++)if(phaseone_step(in,8)!=0)return 17;
  if(phaseone_serialize_state(state,32)!=0||u32(state+20)!=800u)return 18;
  fprintf(stderr,"native selftest: PASS (ABI/invalid input/reset/miss/hit/repeat/obstacle/wall/pitch)\n");
  return 0;
}
int main(int argc,char **argv) {
  if(argc==2&&strcmp(argv[1],"--selftest")==0)return selftest();
  if(argc!=3){fprintf(stderr,"usage: %s --selftest | TRACE.bin OUTPUT.states\n",argv[0]);return 2;}
  FILE *in=fopen(argv[1],"rb");
  if(!in){perror("trace");return 2;}
  uint8_t hdr[8];
  if(fread(hdr,1,8,in)!=8||memcmp(hdr,"P1T1",4)!=0||u32(hdr+4)>100000u) {
    fprintf(stderr,"invalid trace header/count\n");fclose(in);return 2;
  }
  FILE *out=fopen(argv[2],"wb");
  if(!out){perror("output");fclose(in);return 2;}
  uint32_t count=u32(hdr+4);
  uint8_t rec[8],snapshot[P1_STATE_SIZE];
  if(phaseone_reset(0)!=0)goto error;
  for(uint32_t i=0;i<=count;i++) {
    if(phaseone_serialize_state(snapshot,sizeof snapshot)!=0||
       fwrite(snapshot,1,sizeof snapshot,out)!=sizeof snapshot)goto error;
    if(i==count)break;
    if(fread(rec,1,sizeof rec,in)!=sizeof rec||phaseone_step(rec,sizeof rec)!=0) {
      fprintf(stderr,"invalid trace record at tick %u\n",i+1);goto error;
    }
  }
  if(fgetc(in)!=EOF||ferror(in)){fprintf(stderr,"trailing bytes in trace\n");goto error;}
  if(fclose(out)!=0){fclose(in);return 2;}
  fclose(in);
  fprintf(stderr,"native replay: PASS (%u ticks, %u snapshots)\n",count,count+1);
  return 0;
error:
  fprintf(stderr,"native replay: FAIL\n");fclose(out);fclose(in);return 1;
}
