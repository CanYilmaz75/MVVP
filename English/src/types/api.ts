export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
};

export type ApiSuccess<T> = {
  data: T;
  requestId: string;
};
