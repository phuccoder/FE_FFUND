import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUsersContent, banUser, unbanUser, setUsers } from './userSlice'; // Import setUsers
import { MagnifyingGlassIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const UserManager = () => {
  const dispatch = useDispatch();
  const { users, error, status, totalPages } = useSelector(state => state.user || { users: [], error: null, status: 'idle' });

  const [name, setName] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [userToConfirm, setUserToConfirm] = useState(null);

  // Fetch dữ liệu khi component mount hoặc khi currentPage thay đổi
  useEffect(() => {
    dispatch(getUsersContent({ name, page: currentPage, sortField, sortOrder }));
  }, [dispatch, name, currentPage, sortField, sortOrder]);

  // Hàm ban user
  const handleBanUser = (userId) => {
    setUserToConfirm(userId);
    setIsConfirmOpen(true);
    setOpenDropdown(null);
  };

  // Hàm unban user
  const handleUnbanUser = (userId) => {
    setUserToConfirm(userId);
    setIsConfirmOpen(true);
    setOpenDropdown(null);
  };

  // Xử lý xác nhận ban/unban
  const confirmBanUnban = () => {
    if (userToConfirm) {
      const user = users.find(u => u.id === userToConfirm);
      if (user.isBanned) {
        dispatch(unbanUser(userToConfirm)).then((result) => {
          if (!result.error) {
            toast.success('User unbanned successfully!');
            // Cập nhật trạng thái ngay lập tức
            const updatedUsers = users.map(u => u.id === userToConfirm ? { ...u, isBanned: false } : u);
            dispatch(setUsers(updatedUsers));  // Cập nhật danh sách người dùng
            setIsConfirmOpen(false);
          }
        });
      } else {
        dispatch(banUser(userToConfirm)).then((result) => {
          if (!result.error) {
            toast.success('User banned successfully!');
            // Cập nhật trạng thái ngay lập tức
            const updatedUsers = users.map(u => u.id === userToConfirm ? { ...u, isBanned: true } : u);
            dispatch(setUsers(updatedUsers));  // Cập nhật danh sách người dùng
            setIsConfirmOpen(false);
          }
        });
      }
    }
  };

  // Mở hoặc đóng dropdown
  const toggleDropdown = (userId) => {
    setOpenDropdown(openDropdown === userId ? null : userId);
  };

  // Giữ lại giá trị name và chỉ gửi yêu cầu khi nhấn Enter hoặc khi nhấn nút search
  const handleSearch = () => {
    setCurrentPage(0);
    dispatch(getUsersContent({ name, page: 0, sortField, sortOrder }));
  };

  // Giữ lại giá trị name và chỉ gửi yêu cầu khi nhấn Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (status === 'failed') {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-8">
        {/* Tìm kiếm và Sắp xếp */}
        <div className="mb-6 flex items-center space-x-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}  // Chỉ thay đổi giá trị name, không gọi API
            onKeyPress={handleKeyPress}  // Chỉ gọi API khi nhấn Enter
            placeholder="Search by name"
            className="px-4 py-2 border rounded-lg w-64"
          />
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}  // Chọn trường sắp xếp
            className="px-4 py-2 border rounded-lg"
          >
            <option value="id">ID</option>
            <option value="fullName">Full Name</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}  // Chọn chiều sắp xếp
            className="px-4 py-2 border rounded-lg"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
          <button
            onClick={handleSearch} // Gọi hàm search khi nhấn nút
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-700 transition duration-200 relative group"
          >
            <MagnifyingGlassIcon className="w-5 h-5 inline-block" />
            <span className="absolute left-1/2 transform -translate-x-1/2 top-12 text-sm text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Search
            </span>
          </button>
        </div>

        {/* Hiển thị thông báo lỗi hoặc thành công */}
        {error && <div className="p-4 mb-4 bg-red-200 text-red-800 rounded-lg text-center">{error}</div>}

        {/* Hiển thị bảng Users */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-left text-sm font-semibold text-gray-700">
                <th className="px-4 py-2">No</th>
                <th className="px-4 py-2">Avatar</th>
                <th className="px-4 py-2">Full Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Telephone Number</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(users) && users.length > 0 ? users.map((user, index) => (
                <tr key={user.id} className="border-t">
                  <td className="px-4 py-2 text-sm text-gray-700">{index + 1}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    <img 
                      src={user.userAvatar ? `path/to/avatars/${user.userAvatar}` : 'https://img.pikbest.com/png-images/qianku/default-avatar_2405039.png!w700wp'} 
                      alt={user.fullName} 
                      className="w-12 h-12 rounded-full"
                    />
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">{user.fullName}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{user.email}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{user.telephoneNumber}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{user.roles}</td>
                  <td className="px-4 py-2 text-sm text-center">
                    <button
                      onClick={() => toggleDropdown(user.id)} // Mở dropdown
                      className="bg-orange-500 text-white px-3 py-1 rounded-full hover:bg-orange-700 transition duration-200"
                    >
                      <EllipsisHorizontalIcon className="w-5 h-5 inline-block" />
                    </button>

                    {/* Dropdown menu */}
                    {openDropdown === user.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md z-10">
                        <ul className="py-1">
                          <li>
                            {user.isBanned ? (
                              <button
                                onClick={() => handleUnbanUser(user.id)}
                                className="block px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                              >
                                Unban User
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBanUser(user.id)}
                                className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                              >
                                Ban User
                              </button>
                            )}
                          </li>
                        </ul>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="text-center text-gray-600 py-4">No users available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Phân trang */}
        <div className="mt-4 flex justify-center space-x-4">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0} className="px-4 py-2 bg-gray-300 rounded-lg">Previous</button>
          <span className="px-4 py-2">{currentPage + 1} / {totalPages}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1} className="px-4 py-2 bg-gray-300 rounded-lg">Next</button>
        </div>
      </div>

      {/* Modal xác nhận ban/unban */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-6 w-full sm:w-96 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Are you sure you want to {users.find(user => user.id === userToConfirm)?.isBanned ? 'unban' : 'ban'} this user?
            </h3>
            <div className="flex justify-around mt-4">
              <button
                onClick={confirmBanUnban}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition duration-200 w-24"
              >
                Yes
              </button>
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition duration-200 w-24"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
