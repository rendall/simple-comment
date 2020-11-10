/**
 * Return object with properties in props removed
 */
export const removeProps = <T>(obj:T, props: string[]):Partial<T> => Object.keys(obj).reduce((outObj, prop) => props.includes(prop) ? outObj : { ...outObj, [prop]: obj[prop] }, {})