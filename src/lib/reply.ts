export function ok(data: unknown, msg = '') {
  return {
    code: 0,
    data,
    msg
  };
}

export function fail(code: number, msg: string) {
  return {
    code,
    data: '',
    msg
  };
}
