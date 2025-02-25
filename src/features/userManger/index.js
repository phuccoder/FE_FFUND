import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUsersContent } from './userSlice';
import { TrashIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

const UserManager = () => {
  const dispatch = useDispatch();
  const { users, error, status } = useSelector(state => state.user || { users: [], error: null, status: 'idle' });  // Kiểm tra xem state có đúng không

  useEffect(() => {
    dispatch(getUsersContent()); // Gọi action để lấy danh sách người dùng khi component được render
  }, [dispatch]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'failed') {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-8">
        {/* Nút Create New User */}
        <div className="mb-6 text-right relative group">
          <button
            onClick={() => {/* Mở modal tạo người dùng */}}
            className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-700 transition duration-200"
          >
            <PlusIcon className="w-5 h-5 inline-block" />
          </button>
          <span className="absolute left-1/2 transform -translate-x-1/2 top-12 text-sm text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Add new User
          </span>
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
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {
                users && users.length > 0 ? users.map((user, index) => (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-2 text-sm text-gray-700">{index + 1}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      <img src={`path/to/avatars/${user.userAvatar}`} alt={user.fullName} className="w-12 h-12 rounded-full"/>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">{user.fullName}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{user.telephoneNumber}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{user.roles}</td>
                    <td className="px-4 py-2 text-sm text-center">
                      <button
                        className="bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-700 transition duration-200"
                        onClick={() => {/* Mở modal sửa người dùng */}}
                      >
                        <PencilIcon className="w-5 h-5 inline-block" />
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-700 transition duration-200 ml-2"
                        onClick={() => {/* Gọi hàm xóa người dùng */}}
                      >
                        <TrashIcon className="w-5 h-5 inline-block" />
                      </button>
                    </td>
                  </tr>
                )) :
                <tr>
                  <td colSpan="7" className="text-center text-gray-600 py-4">No users available</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManager;
