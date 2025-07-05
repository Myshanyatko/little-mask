export interface ILittleMaskSeparately<T> {
    validators: { [key: string]: T },
    mask: string
}
export type TLtlPlainMask = string | RegExp | RegExp[] | string[];
export type TLtlMaskInput = TLtlPlainMask | ILittleMaskSeparately<TLtlPlainMask>
