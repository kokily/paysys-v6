import type { Context } from 'koa';
import Joi from 'joi';
import { validateBody } from '../../libs/utils';
import {
  ITEM_NOT_FOUND_MESSAGE,
  UNKNOWN_SERVER_ERROR_MESSAGE,
} from '../../libs/constants';
import { dataSource } from '../../server';
import Item from '../../entities/Item';

// Add Item API
export async function addItemAPI(ctx: Context) {
  type RequestType = {
    name: string;
    divide: string;
    native: string;
    unit: string;
    price: number;
  };

  const schema = Joi.object().keys({
    name: Joi.string().required(),
    divide: Joi.string().required(),
    native: Joi.string().required(),
    unit: Joi.string().required(),
    price: Joi.string().required(),
  });

  if (!validateBody(ctx, schema)) return;

  const payload: RequestType = ctx.request.body as RequestType;

  try {
    const itemRepo = dataSource.getRepository(Item);
    const itemCount = await itemRepo.count();

    const item = itemRepo.create({
      ...payload,
      num: itemCount + 1,
    });

    await itemRepo.save(item);

    ctx.status = 201;
    ctx.body = item;
  } catch (error) {
    console.error('AddItem API Error', error);

    if (error instanceof Error) {
      ctx.throw(500, `Internal Server Error: ${error.message}`);
    } else {
      ctx.throw(500, UNKNOWN_SERVER_ERROR_MESSAGE);
    }
  }
}

// List Items API
export async function listItemsAPI(ctx: Context) {
  type ListItemsQuery = {
    divide?: string;
    native?: string;
    name?: string;
    cursor?: string;
  };

  const queryParams: ListItemsQuery = ctx.query as ListItemsQuery;
  const { divide, native, name, cursor } = queryParams;

  try {
    const itemRepo = dataSource.getRepository(Item);
    const queryBuilder = itemRepo
      .createQueryBuilder('item')
      .limit(30)
      .orderBy('item.num', 'DESC');

    // 동적 쿼리
    if (divide) {
      queryBuilder.andWhere('item.divide = :divide', { divide });
    }

    if (native) {
      queryBuilder.andWhere('item.native = :native', { native });
    }

    if (name) {
      queryBuilder.andWhere('item.name LIKE :name', {
        name: `${name}`,
      });
    }

    if (cursor) {
      const cursorItem = await itemRepo.findOneBy({ id: cursor });

      if (!cursorItem) {
        ctx.throw(404, ITEM_NOT_FOUND_MESSAGE);
      }

      queryBuilder.andWhere('item.num < : num', {
        num: cursorItem.num,
      });
    }

    const items = await queryBuilder.getMany();

    ctx.status = 200;
    ctx.body = items;
  } catch (error) {
    console.error('ListItems API Error', error);

    if (error instanceof Error) {
      ctx.throw(500, `Internal Server Error: ${error.message}`);
    } else {
      ctx.throw(500, UNKNOWN_SERVER_ERROR_MESSAGE);
    }
  }
}

// Read Item API
export async function readItemAPI(ctx: Context) {}

// Remove Item API
export async function removeItemAPI(ctx: Context) {}

// Update Item API
export async function updateItemAPI(ctx: Context) {}
