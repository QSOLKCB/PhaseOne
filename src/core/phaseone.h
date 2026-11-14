#ifndef PHASEONE_H
#define PHASEONE_H
#include <stdint.h>
#define P1_ABI_VERSION 1u
#define P1_INPUT_SIZE 8u
#define P1_STATE_SIZE 32u
#define P1_TICK_HZ 60u
#define P1_OK 0
#define P1_ERR_NULL (-1)
#define P1_ERR_LENGTH (-2)
#define P1_ERR_RECORD (-3)
#define P1_ERR_BUFFER (-4)
#define P1_ERR_VERSION (-5)
#define P1_FORWARD 1u
#define P1_BACK 2u
#define P1_LEFT 4u
#define P1_RIGHT 8u
#define P1_FIRE 16u
uint32_t phaseone_abi_version(void);
int32_t phaseone_require_abi(uint32_t version);
int32_t phaseone_reset(uint32_t seed);
int32_t phaseone_step(const uint8_t *record, uint32_t length);
uint32_t phaseone_state_size(void);
int32_t phaseone_serialize_state(uint8_t *output, uint32_t capacity);
uint32_t phaseone_input_ptr(void);
uint32_t phaseone_state_ptr(void);
#endif
