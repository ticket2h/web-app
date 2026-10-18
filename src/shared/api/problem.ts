/**
 * Lỗi từ BE: RFC 9457 (application/problem+json) kèm trường `code`, ví dụ SEAT_UNAVAILABLE.
 * Bảng mã lỗi: core-service/docs/api.md. Xử lý theo `code`, không theo chuỗi `detail`.
 */
export interface Problem {
  type?: string
  title?: string
  status: number
  detail?: string
  code?: string
  [extra: string]: unknown
}

export class ApiError extends Error {
  readonly problem: Problem

  constructor(problem: Problem) {
    super(problem.detail ?? problem.title ?? `HTTP ${problem.status}`)
    this.name = 'ApiError'
    this.problem = problem
  }

  get code(): string | undefined {
    return this.problem.code
  }

  get status(): number {
    return this.problem.status
  }
}

/** Đổi lỗi bất kỳ (ApiError, mất mạng...) thành câu hiển thị cho người dùng. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.problem.detail ?? error.problem.title ?? 'Đã có lỗi xảy ra'
  }
  if (error instanceof TypeError) {
    return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'
  }
  return 'Đã có lỗi xảy ra, vui lòng thử lại'
}

/** Chuyển kết quả của openapi-fetch thành dữ liệu, hoặc ném ApiError để TanStack Query nhận là lỗi. */
export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (result.error !== undefined || !result.response.ok) {
    throw new ApiError(toProblem(result.error, result.response))
  }
  return result.data as T
}

function toProblem(body: unknown, response: Response): Problem {
  if (body && typeof body === 'object' && 'status' in body) {
    return body as Problem
  }
  // Lỗi không theo RFC 9457, ví dụ gateway trả 502 trang HTML
  return { status: response.status, title: response.statusText }
}
