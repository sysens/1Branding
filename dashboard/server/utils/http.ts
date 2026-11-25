// Small request helpers shared by the API handlers.
import { createError, getRouterParam, type H3Event } from "h3";

export function idParam(event: H3Event, name = "id"): number {
  const id = Number(getRouterParam(event, name));
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, message: "Неверный идентификатор" });
  return id;
}

export const notFound = (what = "Запись") => createError({ statusCode: 404, message: `${what} не найдена` });

const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const isDay = (value: unknown): value is string => typeof value === "string" && DAY.test(value);
