"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAllDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriverById,
} from "@/services/driver.service";
import { getAllVehicles } from "@/services/vehicle.service";
import { DriverCreateRequest, DriverRequest, DriverResponse } from "@/types/driver";
import { VehicleResponse } from "@/types/vehicle";
import { ApiError } from "@/services/api.client";

const EMPTY_CREATE_FORM: DriverCreateRequest = {
  username: "",
  password: "Password123@",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  dateOfBirth: "1990-01-01",
  gender: "MALE",
  hireDate: new Date().toISOString().slice(0, 10),
  exactAddress: "",
  commune: "",
  province: "",
  isActive: true,
  vehicleId: "",
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverResponse[]>([]);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<string>("ALL");

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<DriverCreateRequest>(EMPTY_CREATE_FORM);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverResponse | null>(null);
  const [editForm, setEditForm] = useState<DriverRequest>({
    hireDate: "",
    isActive: true,
    vehicleId: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Detail Modal (GET /drivers/{id})
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingDriver, setViewingDriver] = useState<DriverResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [driverData, vehicleData] = await Promise.all([
        getAllDrivers(),
        getAllVehicles(),
      ]);
      setDrivers(driverData);
      setVehicles(vehicleData);
    } catch (err: unknown) {
      console.error("Lỗi khi tải dữ liệu tài xế / xe:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredDrivers = drivers.filter((d) => {
    const q = searchTerm.toLowerCase();
    const fullName = d.staff?.fullName || `${d.staff?.lastName || ""} ${d.staff?.firstName || ""}`;
    const phone = d.staff?.phone || "";
    const plate = d.vehicle?.plateNumber || "";
    const matchSearch =
      !q ||
      fullName.toLowerCase().includes(q) ||
      phone.toLowerCase().includes(q) ||
      plate.toLowerCase().includes(q);

    const matchActive =
      filterActive === "ALL" ||
      (filterActive === "ACTIVE" && d.isActive) ||
      (filterActive === "INACTIVE" && !d.isActive);

    return matchSearch && matchActive;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !createForm.username.trim() ||
      !createForm.lastName.trim() ||
      !createForm.firstName.trim() ||
      !createForm.phone.trim()
    ) {
      setCreateError("Vui lòng điền đầy đủ Tên đăng nhập, Họ, Tên và Số điện thoại.");
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const payload: DriverCreateRequest = {
        ...createForm,
        vehicleId: createForm.vehicleId ? createForm.vehicleId : undefined,
      };
      await createDriver(payload, avatarFile);
      setShowCreateModal(false);
      setCreateForm(EMPTY_CREATE_FORM);
      setAvatarFile(null);
      setAvatarPreview(null);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setCreateError(err.message);
      } else {
        setCreateError("Lỗi khi tạo tài xế trọn gói.");
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditModal = (driver: DriverResponse) => {
    setEditingDriver(driver);
    setEditForm({
      hireDate: driver.hireDate || new Date().toISOString().slice(0, 10),
      isActive: driver.isActive ?? true,
      vehicleId: driver.vehicle?.id || "",
    });
    setEditError(null);
    setShowEditModal(true);
  };

  const handleOpenDetail = async (driverId: string) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    setDetailError(null);
    setViewingDriver(null);

    try {
      // Calls GET /drivers/{id}
      const data = await getDriverById(driverId);
      setViewingDriver(data);
    } catch (err: unknown) {
      setDetailError(err instanceof Error ? err.message : "Không thể tải chi tiết tài xế.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;

    setEditLoading(true);
    setEditError(null);

    try {
      const payload: DriverRequest = {
        hireDate: editForm.hireDate,
        isActive: editForm.isActive,
        vehicleId: editForm.vehicleId ? editForm.vehicleId : undefined,
      };
      await updateDriver(editingDriver.id, payload);
      setShowEditModal(false);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setEditError(err.message);
      } else {
        setEditError("Lỗi khi cập nhật hồ sơ tài xế.");
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (driver: DriverResponse) => {
    const driverName = driver.staff?.fullName || driver.id;
    if (!confirm(`Bạn có chắc chắn muốn xóa tài xế: ${driverName}?`)) {
      return;
    }
    try {
      await deleteDriver(driver.id);
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Xóa tài xế thất bại.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-900">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Quản lý Tài xế
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchData}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
            <button
              type="button"
              onClick={() => {
                setCreateForm(EMPTY_CREATE_FORM);
                setAvatarFile(null);
                setAvatarPreview(null);
                setCreateError(null);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Tạo tài xế trọn gói
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Tìm theo tên tài xế, SĐT, biển số xe..."
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
            <span className="text-xs text-gray-500 font-medium">Trạng thái:</span>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-blue-500 focus:outline-none shadow-sm"
            >
              <option value="ALL">Tất cả tài xế</option>
              <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
              <option value="INACTIVE">Tạm ngưng (INACTIVE)</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-3" />
            <p className="text-xs text-gray-500">Đang tải danh sách tài xế...</p>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900">Không tìm thấy tài xế nào</h3>
            <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
              Chưa có tài xế nào trong hệ thống hoặc không khớp với tiêu chí tìm kiếm.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3.5">Tài xế</th>
                  <th className="px-4 py-3.5">Số điện thoại</th>
                  <th className="px-4 py-3.5">Username</th>
                  <th className="px-4 py-3.5">Xe được giao</th>
                  <th className="px-4 py-3.5">Ngày tuyển dụng</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDrivers.map((driver) => {
                  const staff = driver.staff;
                  const fullName = staff?.fullName || `${staff?.lastName || ""} ${staff?.firstName || ""}`;
                  return (
                    <tr key={driver.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs uppercase shadow-sm">
                            {driver.urlImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={driver.urlImage}
                                alt="Driver"
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              fullName.slice(0, 1) || "D"
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{fullName || "Chưa cập nhật tên"}</p>

                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-gray-700">
                        {staff?.phone || "—"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-gray-800">
                          {staff?.account?.username || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {driver.vehicle ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {driver.vehicle.plateNumber}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              ({driver.vehicle.status})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">Chưa giao xe</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-gray-600">
                        {driver.hireDate || "—"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${driver.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                            }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${driver.isActive ? "bg-emerald-500" : "bg-gray-400"
                              }`}
                          />
                          {driver.isActive ? "Hoạt động" : "Tạm ngưng"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(driver.id)}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Xem chi tiết (GET /drivers/{id})"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(driver)}
                          className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Cập nhật trạng thái / Đổi xe"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(driver)}
                          className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                          title="Xóa tài xế"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal Tạo tài xế trọn gói (DriverCreateRequest) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900">
                Tạo hồ sơ Tài xế trọn gói
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {createError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 space-y-3">
                <span className="font-bold text-blue-900 uppercase tracking-wide text-[11px] block">
                  1. Tài khoản đăng nhập App Mobile (Role: DRIVER)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Tên đăng nhập *</label>
                    <input
                      type="text"
                      required
                      value={createForm.username}
                      onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                      placeholder="driver_vana"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Mật khẩu *</label>
                    <input
                      type="text"
                      required
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="Password123@"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Ảnh đại diện / Avatar upload */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 space-y-2">
                <span className="font-bold text-gray-900 uppercase tracking-wide text-[11px] block">
                  Ảnh chân dung Tài xế (Avatar)
                </span>
                <div className="flex items-center gap-4">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white overflow-hidden shadow-sm shrink-0">
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      id="avatar-input"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAvatarFile(file);
                          setAvatarPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="avatar-input"
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer shadow-sm"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {avatarFile ? "Chọn ảnh khác" : "Tải ảnh từ máy tính"}
                    </label>
                    <p className="mt-1 text-[11px] text-gray-500">
                      {avatarFile ? avatarFile.name : "Hỗ trợ định dạng JPG, PNG, WEBP"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="font-bold text-gray-900 uppercase tracking-wide text-[11px] block">
                  2. Thông tin cá nhân &amp; Hồ sơ
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Họ và tên đệm *</label>
                    <input
                      type="text"
                      required
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                      placeholder="Nguyễn Văn"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Tên chính *</label>
                    <input
                      type="text"
                      required
                      value={createForm.firstName}
                      onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
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
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      placeholder="0901234567"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={createForm.email || ""}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="driver@example.com"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Ngày sinh</label>
                    <input
                      type="date"
                      value={createForm.dateOfBirth}
                      onChange={(e) => setCreateForm({ ...createForm, dateOfBirth: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Giới tính</label>
                    <select
                      value={createForm.gender || "MALE"}
                      onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value as "MALE" | "FEMALE" | "OTHER" })}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="MALE">Nam (MALE)</option>
                      <option value="FEMALE">Nữ (FEMALE)</option>
                      <option value="OTHER">Khác (OTHER)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Ngày tuyển dụng</label>
                    <input
                      type="date"
                      value={createForm.hireDate}
                      onChange={(e) => setCreateForm({ ...createForm, hireDate: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Địa chỉ chi tiết (số nhà, đường...)</label>
                  <input
                    type="text"
                    value={createForm.exactAddress || ""}
                    onChange={(e) => setCreateForm({ ...createForm, exactAddress: e.target.value })}
                    placeholder="123 Phố Huế"
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Phường / Xã</label>
                    <input
                      type="text"
                      value={createForm.commune || ""}
                      onChange={(e) => setCreateForm({ ...createForm, commune: e.target.value })}
                      placeholder="Hàng Bài"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Tỉnh / Thành phố</label>
                    <input
                      type="text"
                      value={createForm.province || ""}
                      onChange={(e) => setCreateForm({ ...createForm, province: e.target.value })}
                      placeholder="Hà Nội"
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Gán phương tiện ban đầu (tùy chọn)</label>
                  <select
                    value={createForm.vehicleId || ""}
                    onChange={(e) => setCreateForm({ ...createForm, vehicleId: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Chưa gán phương tiện --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plateNumber} — {v.vehicleTypeName || "Xe"} ({v.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {createLoading ? "Đang khởi tạo..." : "Tạo tài xế"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cập nhật Hồ sơ Tài xế (DriverRequest) */}
      {showEditModal && editingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Cập nhật Hồ sơ Tài xế
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingDriver.staff?.fullName || editingDriver.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {editError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Ngày tuyển dụng *</label>
                <input
                  type="date"
                  required
                  value={editForm.hireDate}
                  onChange={(e) => setEditForm({ ...editForm, hireDate: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Phương tiện được giao</label>
                <select
                  value={editForm.vehicleId || ""}
                  onChange={(e) => setEditForm({ ...editForm, vehicleId: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Chưa giao xe / Thu hồi xe --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} — {v.vehicleTypeName || "Xe"} ({v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Trạng thái hoạt động</label>
                <select
                  value={editForm.isActive ? "true" : "false"}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "true" })}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="true">Đang hoạt động (ACTIVE)</option>
                  <option value="false">Tạm ngưng hoạt động (INACTIVE)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Tài xế (GET /drivers/{id}) */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className="relative w-full max-w-2xl rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Chi tiết Hồ sơ Tài xế</h3>

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
                <p className="text-xs text-gray-500">Đang tra cứu dữ liệu hồ sơ tài xế...</p>
              </div>
            ) : detailError ? (
              <div className="rounded-2xl bg-red-50 p-5 text-center text-xs text-red-600 border border-red-200">
                <p className="font-semibold mb-1">Tra cứu thất bại</p>
                <p>{detailError}</p>
              </div>
            ) : viewingDriver ? (
              <div className="space-y-6">
                {/* Header profile card with Avatar */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-blue-50/50 to-indigo-50/50 border border-emerald-100">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-md bg-white">
                    {viewingDriver.urlImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={viewingDriver.urlImage}
                        alt="Ảnh đại diện tài xế"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-emerald-100 text-emerald-700 font-bold text-2xl uppercase">
                        {(viewingDriver.staff?.fullName || "D").slice(0, 1)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">
                          {viewingDriver.staff?.fullName || `${viewingDriver.staff?.lastName || ""} ${viewingDriver.staff?.firstName || ""}` || "Chưa cập nhật tên"}
                        </h4>

                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 self-center sm:self-start px-2.5 py-1 rounded-full text-xs font-bold ${viewingDriver.isActive
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${viewingDriver.isActive ? "bg-emerald-600" : "bg-gray-400"
                            }`}
                        />
                        {viewingDriver.isActive ? "Đang hoạt động" : "Tạm ngưng"}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-medium text-gray-500">Ngày tuyển dụng:</span>
                        <span className="font-semibold text-gray-800">{viewingDriver.hireDate || "—"}</span>
                      </span>
                      {viewingDriver.staff?.gender && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-gray-200 text-gray-700">
                          {viewingDriver.staff.gender === "MALE" ? "Nam" : viewingDriver.staff.gender === "FEMALE" ? "Nữ" : "Khác"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid chi tiết: Phương tiện & Hồ sơ cá nhân */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phương tiện được giao */}
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                    <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      Phương tiện được bàn giao (Vehicle)
                    </h5>
                    {viewingDriver.vehicle ? (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Biển số xe:</span>
                          <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {viewingDriver.vehicle.plateNumber}
                          </span>
                        </div>
                        {viewingDriver.vehicle.vin && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Số khung (VIN):</span>
                            <span className="font-mono text-gray-800">{viewingDriver.vehicle.vin}</span>
                          </div>
                        )}
                        {viewingDriver.vehicle.capacity && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Sức chứa:</span>
                            <span className="font-medium text-gray-800">{viewingDriver.vehicle.capacity} chỗ / tấn</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Trạng thái xe:</span>
                          <span className="font-semibold text-emerald-600">{viewingDriver.vehicle.status || "AVAILABLE"}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic py-2">Tài xế hiện tại chưa được bàn giao phương tiện nào.</p>
                    )}
                  </div>

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
                        <span className="font-mono font-bold text-gray-800">{viewingDriver.staff?.phone || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Email cá nhân:</span>
                        <span className="font-medium text-gray-800">{viewingDriver.staff?.email || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Ngày sinh:</span>
                        <span className="font-medium text-gray-800">{viewingDriver.staff?.dateOfBirth || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Địa chỉ & Tài khoản */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Địa chỉ */}
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                    <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      Địa chỉ cư trú
                    </h5>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-gray-500 block">Địa chỉ chi tiết:</span>
                        <span className="font-medium text-gray-800">{viewingDriver.staff?.exactAddress || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Phường / Xã, Quận / Huyện:</span>
                        <span className="font-medium text-gray-800">{viewingDriver.staff?.commune || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Tỉnh / Thành phố:</span>
                        <span className="font-medium text-gray-800">{viewingDriver.staff?.province || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tài khoản Driver */}
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                    <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Tài khoản ứng dụng di động
                    </h5>
                    {viewingDriver.staff?.account ? (
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-gray-500 block">Tên đăng nhập (Username):</span>
                          <span className="font-mono font-bold text-gray-900">{viewingDriver.staff.account.username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Vai trò:</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {viewingDriver.staff.account.role || "DRIVER"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Trạng thái tài khoản:</span>
                          <span className="font-semibold text-emerald-600">
                            {viewingDriver.staff.account.status || "ACTIVE"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Chưa được kích hoạt tài khoản.</p>
                    )}
                  </div>
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
    </div>
  );
}
