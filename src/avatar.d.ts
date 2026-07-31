export type Pixel = readonly [column: number, row: number];
export type AvatarFormat = "svg" | "png";

export interface AvatarDescriptor {
  readonly version: string;
  readonly fingerprint: string;
  readonly accent: string;
  readonly pixels: readonly Pixel[];
}

export interface AvatarOptions {
  secret: string;
  size?: number;
  title?: string;
}

export interface RenderOptions {
  size?: number;
  title?: string;
}

export const AVATAR_VERSION: string;
export const DEFAULT_SIZE: number;
export const MIN_SIZE: number;
export const MAX_SIZE: number;
export const PALETTE: readonly string[];

export function normalizeSize(value?: number | string): number;
export function createAvatarDescriptor(
  userId: string,
  options: Pick<AvatarOptions, "secret">,
): AvatarDescriptor;
export function assertAvatarDescriptor(descriptor: AvatarDescriptor): AvatarDescriptor;
export function renderAvatarSvg(descriptor: AvatarDescriptor, options?: RenderOptions): string;
export function generateAvatarSvg(userId: string, options: AvatarOptions): string;
export function renderAvatarPng(
  descriptor: AvatarDescriptor,
  options?: Pick<RenderOptions, "size">,
): Buffer;
export function generateAvatarPng(
  userId: string,
  options: Pick<AvatarOptions, "secret" | "size">,
): Buffer;
export function avatarEtag(
  descriptor: AvatarDescriptor,
  format: AvatarFormat,
  size: number,
): string;
