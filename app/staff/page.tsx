"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffById,
} from "@/services/staff.service";
import { StaffRequest, StaffResponse } from "@/types/staff";
import { ApiError } from "@/services/api.client";

const EMPTY_FORM: StaffRequest = {
  firstName: "",
  lastName: "",
  dateOfBirth: "1995-01-01",
  gender: "MALE",
  phone: "",
  email: "",
  exactAddress: "",
  commune: "",
  province: "",
};

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState<string>("ALL");

  // Create / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffRequest>(EMPTY_FORM);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Detail Modal (GET /staff/{id})
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingStaff, setViewingStaff] = useState<StaffResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllStaff();
      setStaffList(data);
    } catch (err: unknown) {
      console.error("Lỗi khi tải danh sách nhân sự:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const filteredStaff = staffList.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      s.fullName?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q));
    const matchGender = filterGender === "ALL" || s.gender === filterGender;
    return matchSearch && matchGender;
  });

  const openCreateModal = () => {
    setIsEdit(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalError(null);
    setShowModal(true);
  };

  const openEditModal = (staff: StaffResponse) => {
    setIsEdit(true);
    setEditingId(staff.id);
    setForm({
      firstName: staff.firstName || "",
      lastName: staff.lastName || "",
      dateOfBirth: staff.dateOfBirth || "1995-01-01",
      gender: staff.gender || "MALE",
      phone: staff.phone || "",
      email: staff.email || "",
      exactAddress: staff.exactAddress || "",
      commune: staff.commune || "",
      province: staff.province || "",
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenDetail = async (staffId: string) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    setDetailError(null);
    setViewingStaff(null);

    try {
      // Calls GET /staff/{id}
      const data = await getStaffById(staffId);
      setViewingStaff(data);
    } catch (err: unknown) {
      setDetailError(err instanceof Error ? err.message : "Không thể tải chi tiết nhân sự.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lastName.trim() || !form.firstName.trim() || !form.phone.trim() || !form.dateOfBirth) {
      setModalError("Vui lòng điền Họ, Tên, Số điện thoại và Ngày sinh.");
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      if (isEdit && editingId) {
        await updateStaff(editingId, form);
      } else {
        await createStaff(form);
      }
      setShowModal(false);
      fetchStaff();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setModalError(err.message);
      } else {
        setModalError("Có lỗi xảy ra khi lưu thông tin nhân sự.");
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (staff: StaffResponse) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa hồ sơ nhân sự: ${staff.fullName || staff.id}?`)) {
      return;
    }
    try {
      await deleteStaff(staff.id);
      fetchStaff();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Xóa nhân sự thất bại.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-900">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                Human Resources Management
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Quản lý Hồ sơ Nhân sự (Staff)
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Quản lý danh sách cán bộ, nhân viên, quản trị viên và tài xế trong hệ thống.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchStaff}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm nhân viên mới
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Tìm theo họ tên, SĐT, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
            <svg
              className="absolute left-3.5 top-3 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-gray-500 font-medium">Giới tính:</span>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-blue-500 focus:outline-none shadow-sm"
            >
              <option value="ALL">Tất cả</option>
              <option value="MALE">Nam (MALE)</option>
              <option value="FEMALE">Nữ (FEMALE)</option>
              <option value="OTHER">Khác (OTHER)</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-3" />
            <p className="text-xs text-gray-500">Đang tải danh sách nhân sự...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900">Không tìm thấy hồ sơ nhân sự nào</h3>
            <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
              Chưa có nhân viên nào trong danh sách hoặc không khớp với bộ lọc tìm kiếm.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Họ và Tên</th>
                  <th className="px-4 py-3.5">Số điện thoại</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Ngày sinh / Giới tính</th>
                  <th className="px-4 py-3.5">Địa chỉ</th>
                  <th className="px-4 py-3.5">Tài khoản (Account)</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs uppercase">
                          {staff.firstName?.slice(0, 1) || "S"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{staff.fullName || `${staff.lastName} ${staff.firstName}`}</p>
                          <p className="text-[10px] text-gray-400 font-mono">ID: {staff.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-gray-700">
                      {staff.phone || "—"}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600">
                      {staff.email || "—"}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600">
                      <span>{staff.dateOfBirth || "—"}</span>
                      {staff.gender && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700">
                          {staff.gender === "MALE" ? "Nam" : staff.gender === "FEMALE" ? "Nữ" : "Khác"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 max-w-xs truncate text-gray-600" title={`${staff.exactAddress || ""}, ${staff.commune || ""}, ${staff.province || ""}`}>
                      {[staff.exactAddress, staff.commune, staff.province].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {staff.account ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-semibold text-gray-800">
                            {staff.account.username}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            staff.account.role === "ADMIN"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : staff.account.role === "MANAGER"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {staff.account.role}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Chưa cấp</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(staff.id)}
                        className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Xem chi tiết (GET /staff/{id})"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(staff)}
                        className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(staff)}
                        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                        title="Xóa hồ sơ"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal Chi tiết Nhân sự (GET /staff/{id}) */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className="relative w-full max-w-xl rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Chi tiết Hồ sơ Nhân sự</h3>
                  <p className="text-xs text-gray-500 font-mono">Endpoint: GET /staff/{`{id}`}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {detailLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mb-3" />
                <p className="text-xs text-gray-500">Đang tra cứu dữ liệu nhân sự...</p>
              </div>
            ) : detailError ? (
              <div className="rounded-2xl bg-red-50 p-5 text-center text-xs text-red-600 border border-red-200">
                <p className="font-semibold mb-1">Tra cứu thất bại</p>
                <p>{detailError}</p>
              </div>
            ) : viewingStaff ? (
              <div className="space-y-6">
                {/* Profile card summary */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50/60 to-emerald-50/60 border border-gray-100">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-xl uppercase shadow-md">
                    {viewingStaff.firstName?.slice(0, 1) || "S"}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">
                      {viewingStaff.fullName || `${viewingStaff.lastName} ${viewingStaff.firstName}`}
                    </h4>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {viewingStaff.id}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                        {viewingStaff.gender === "MALE" ? "Nam" : viewingStaff.gender === "FEMALE" ? "Nữ" : "Khác"}
                      </span>
                      {viewingStaff.createdAt && (
                        <span className="text-[10px] text-gray-500">
                          Ngày tạo: {new Date(viewingStaff.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid chi tiết */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Thông tin liên hệ */}
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                    <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Thông tin liên hệ
                    </h5>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-gray-500 block">Số điện thoại:</span>
                        <span className="font-mono font-bold text-gray-800">{viewingStaff.phone || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Địa chỉ Email:</span>
                        <span className="font-medium text-gray-800">{viewingStaff.email || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Ngày sinh:</span>
                        <span className="font-medium text-gray-800">{viewingStaff.dateOfBirth || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Địa chỉ cư trú */}
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                    <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Địa chỉ cư trú
                    </h5>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-gray-500 block">Địa chỉ chi tiết:</span>
                        <span className="font-medium text-gray-800">{viewingStaff.exactAddress || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Phường / Xã:</span>
                        <span className="font-medium text-gray-800">{viewingStaff.commune || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Tỉnh / Thành phố:</span>
                        <span className="font-medium text-gray-800">{viewingStaff.province || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tài khoản liên kết */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                  <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Tài khoản người dùng (Account)
                  </h5>
                  {viewingStaff.account ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500 block">Tên đăng nhập:</span>
                        <span className="font-mono font-bold text-gray-900">{viewingStaff.account.username}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Vai trò (Role):</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          viewingStaff.account.role === "ADMIN"
                            ? "bg-purple-100 text-purple-700"
                            : viewingStaff.account.role === "MANAGER"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {viewingStaff.account.role}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Trạng thái:</span>
                        <span className="font-semibold text-emerald-600">
                          {viewingStaff.account.status || "ACTIVE"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Hồ sơ này chưa được liên kết với tài khoản hệ thống.</p>
                  )}
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowDetailModal(false)}
                    className="rounded-xl bg-gray-900 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-gray-800 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal Thêm / Cập nhật Nhân sự */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900">
                {isEdit ? "Cập nhật Hồ sơ Nhân sự" : "Tạo mới Hồ sơ Nhân sự"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {modalError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Họ và tên đệm *</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Nguyễn Văn"
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Tên chính *</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="A"
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0901234567"
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email || ""}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="vana@example.com"
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Ngày sinh (yyyy-MM-dd) *</label>
                  <input
                    type="date"
                    required
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Giới tính</label>
                  <select
                    value={form.gender || "MALE"}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as "MALE" | "FEMALE" | "OTHER" })}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="MALE">Nam (MALE)</option>
                    <option value="FEMALE">Nữ (FEMALE)</option>
                    <option value="OTHER">Khác (OTHER)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Địa chỉ chi tiết</label>
                <input
                  type="text"
                  value={form.exactAddress || ""}
                  onChange={(e) => setForm({ ...form, exactAddress: e.target.value })}
                  placeholder="Số nhà, tên ngõ, đường..."
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Phường / Xã</label>
                  <input
                    type="text"
                    value={form.commune || ""}
                    onChange={(e) => setForm({ ...form, commune: e.target.value })}
                    placeholder="Phường Dịch Vọng"
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Tỉnh / Thành phố</label>
                  <input
                    type="text"
                    value={form.province || ""}
                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                    placeholder="Hà Nội"
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {modalLoading ? "Đang xử lý..." : isEdit ? "Lưu thay đổi" : "Tạo nhân viên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
