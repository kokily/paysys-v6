import type { ObjectSchema, ValidationError } from 'joi';
import Bill from '../entities/Bill';
import { Context } from 'koa';

//  constants
export const isProd = process.env.NODE_ENV === 'production';

// Masking Name
export function maskingName(name: string): string {
  if (name.length > 2) {
    let originName = name.split('');

    originName.map((_, i) => {
      if (i === 0 || i === originName.length - 1) return;

      originName[i] = '*';
    });

    let combineName = originName.join();

    return combineName.replace(/,/g, '');
  } else {
    return name.replace(/.$/, '*');
  }
}

// 빌지 Sort
type CountResult = [string, number];

/**
 * @param array 계산할 문자열 배열
 * @returns [문자열, 출현 횟수] 튜플 배열
 */
function getSortedCount(array: string[]): CountResult[] {
  const counts = array.reduce<Record<string, number>>((acc, current) => {
    acc[current] = (acc[current] || 0) + 1;
    return acc;
  }, {});

  // 객체를 [key, value] 튜플 배열로 변환환
  const results: CountResult[] = Object.entries(counts);

  results.sort((a, b) => b[1] - a[1]);

  return results;
}

// 최종 정렬된 데이터 타입
type SortedDataType = {
  name: string;
  count: number;
};

/**
 * @param bills Bill 엔티티의 배열
 * @returns { name: string, count: number }의 배열
 */
export function getSortedList(bills: Bill[]): SortedDataType[] {
  const titles = bills.map((bill) => bill.title);
  const sortedCounts = getSortedCount(titles);

  const sortedData: SortedDataType[] = sortedCounts.map((item) => ({
    name: item[0],
    count: item[1],
  }));

  return sortedData;
}

/**
 * @template T    Joi 스키마가 검증하는 객체 타입
 * @param ctx     Koa Context 객체
 * @param schema  검증에 사용할 Joi ObjectSchema
 * @returns       유효성 검사 true, false
 */
export function validateBody<T>(
  ctx: Context,
  schema: ObjectSchema<T>,
): boolean {
  const { error, value } = schema.validate(ctx.request.body, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    const validationError = error as ValidationError;

    ctx.status = 400;

    ctx.body = {
      message: 'Validation failed',
      details: validationError.details.map((detail) => detail.message),
    };

    return false;
  }

  ctx.body = value;

  return true;
}
