import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUsersContent, banUser, unbanUser } from './userSlice'; // Import các actions
import { MagnifyingGlassIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';

const UserManager = () => {
  const dispatch = useDispatch();
  const { users, error, status } = useSelector(state => state.user || { users: [], error: null, status: 'idle' });

  const [name, setName] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [openDropdown, setOpenDropdown] = useState(null); // Trạng thái để mở/đóng dropdown
  const [isConfirmOpen, setIsConfirmOpen] = useState(false); // Trạng thái cho modal xác nhận
  const [userToConfirm, setUserToConfirm] = useState(null); // Người dùng cần xác nhận ban/unban

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
      if (users.find(user => user.id === userToConfirm).isBanned) {
        dispatch(unbanUser(userToConfirm)).then(() => {
          // Sau khi unban thành công, lấy lại danh sách người dùng
          dispatch(getUsersContent({ name, sortField, sortOrder }));
        });
      } else {
        dispatch(banUser(userToConfirm)).then(() => {
          // Sau khi ban thành công, lấy lại danh sách người dùng
          dispatch(getUsersContent({ name, sortField, sortOrder }));
        });
      }
    }
    setIsConfirmOpen(false); // Đóng modal sau khi xác nhận
  };

  // Mở hoặc đóng dropdown
  const toggleDropdown = (userId) => {
    setOpenDropdown(openDropdown === userId ? null : userId);
  };

  // Giữ lại giá trị name và chỉ gửi yêu cầu khi nhấn Enter hoặc khi nhấn nút search
  const handleSearch = () => {
    dispatch(getUsersContent({ name, sortField, sortOrder }));
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

  if (status === 'failed') {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-8">
        {/* Tìm kiếm và Sắp xếp */}
        <div className="mb-6 flex items-center">
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
            className="ml-4 px-4 py-2 border rounded-lg"
          >
            <option value="id">ID</option>
            <option value="fullName">Full Name</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}  // Chọn chiều sắp xếp
            className="ml-4 px-4 py-2 border rounded-lg"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
          <button
            onClick={handleSearch} // Gọi hàm search khi nhấn nút
            className="ml-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-700 transition duration-200 relative group"
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
                          {!user.isBanned ? (
                            <li>
                              <button
                                onClick={() => handleBanUser(user.id)} // Ban user
                                className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                              >
                                Ban User
                              </button>
                            </li>
                          ) : (
                            <li>
                              <button
                                onClick={() => handleUnbanUser(user.id)} // Unban user
                                className="block px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                              >
                                Unban User
                              </button>
                            </li>
                          )}
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
