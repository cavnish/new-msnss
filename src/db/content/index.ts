import type { ProductContent } from "./types";
import { PRODUCTS_PART1 } from "./products-part1";
import { PRODUCTS_PART2 } from "./products-part2";

export const ALL_PRODUCT_CONTENT: ProductContent[] = [...PRODUCTS_PART1, ...PRODUCTS_PART2];

export type { ProductContent } from "./types";
