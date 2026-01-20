import * as Joi from 'joi';
import ms from 'ms';

/**
 * Joi 커스텀 스키마: ms()로 파싱 가능한 문자열 검증
 * 예) "1h", "30m", "3600s", "7d" 등
 */
export const JoiMsString = Joi.string().custom((value, helpers) => {
  const parsed = ms(value);
  if (typeof parsed !== 'number' || Number.isNaN(parsed)) {
    return helpers.error('any.invalid', { value });
  }
  return value;
}, 'ms() parsable string');
