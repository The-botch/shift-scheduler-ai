/**
 * アプリケーション定数
 *
 * ステータス値やその他の定数を一元管理します。
 */

/**
 * シフト希望のステータス
 */
export const SHIFT_PREFERENCE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

/**
 * シフト計画のステータス
 */
export const PLAN_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
};

/**
 * 有効な全ステータス一覧
 */
export const VALID_PREFERENCE_STATUSES = Object.values(SHIFT_PREFERENCE_STATUS);
export const VALID_PLAN_STATUSES = Object.values(PLAN_STATUS);

export default {
  SHIFT_PREFERENCE_STATUS,
  PLAN_STATUS,
  VALID_PREFERENCE_STATUSES,
  VALID_PLAN_STATUSES,
};
