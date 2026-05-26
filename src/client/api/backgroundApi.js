import toast from "react-hot-toast"
import { logAction } from "./index.js"

/**
 * Run a write API call in the background with optimistic UI.
 *
 * Flow:
 * 1. Show success toast immediately
 * 2. Run API call in background (non-blocking)
 * 3. Log result (SUCCESS/ERROR) to "Log" sheet — NO rollback, NO error toast
 *
 * @param {Object} options
 * @param {() => Promise} options.apiCall        - The API function to call
 * @param {string}        options.successMessage  - Toast message shown immediately
 * @param {string}        options.changeDescription - Description for Log sheet col C
 * @param {string}        options.userName        - User name for Log sheet col B
 * @param {(result) => void} [options.onComplete] - Optional callback after API finishes
 */
export function runInBackground({
  apiCall,
  successMessage,
  changeDescription,
  userName,
  optimistic = true,
  showErrorOnFailure = false,
  onComplete,
}) {
  // 1. Optional optimistic success toast
  if (optimistic) {
    toast.success(successMessage || "Thành công!")
  }

  // 2. Run API in background — fire and forget
  Promise.resolve()
    .then(() => apiCall())
    .then((result) => {
      // 3a. Log SUCCESS
      const isSuccess = result?.success !== false
      if (isSuccess && !optimistic) {
        toast.success(successMessage || "Thành công!")
      }
      if (!isSuccess && showErrorOnFailure) {
        toast.error(result?.message || "Thao tác thất bại")
      }
      logAction({
        userName: userName || "unknown",
        changeDescription: changeDescription || "",
        status: isSuccess ? "SUCCESS" : "ERROR",
        errorMessage: isSuccess ? "" : (result?.message || "API trả về lỗi"),
      }).catch(() => {
        // Ignore log failures silently
      })

      if (onComplete) onComplete(result)
    })
    .catch((err) => {
      // 3b. Log ERROR
      if (showErrorOnFailure) {
        toast.error(err?.message || "Thao tác thất bại")
      }
      logAction({
        userName: userName || "unknown",
        changeDescription: changeDescription || "",
        status: "ERROR",
        errorMessage: err?.message || String(err) || "Lỗi không xác định",
      }).catch(() => {
        // Ignore log failures silently
      })

      if (onComplete) onComplete({ success: false, message: err?.message })
    })
}
