import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCategoriesContent, deleteCategory, updateCategory, createCategory } from './categorySlice';
import { TrashIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

function Categories() {
    const dispatch = useDispatch();
    const { categories } = useSelector(state => state.category);  // Loại bỏ 'error' và 'status'

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);  // Modal open/close state
    const [isEdit, setIsEdit] = useState(false);  // Sử dụng để kiểm tra trạng thái Edit
    const [categoryForm, setCategoryForm] = useState({
        id: '',
        categoryName: '',
        categoryDescription: '',
        subCategories: [{ subCategoryName: '', subCategoryDescription: '' }]  // Thêm subCategoryDescription vào đây
    });
    const [message, setMessage] = useState('');  // Lưu thông báo thành công hoặc lỗi
    const [errorMessage, setErrorMessage] = useState('');  // Lưu thông báo lỗi trong modal
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);  // Điều khiển việc mở modal xác nhận xóa
    const [categoryToDelete, setCategoryToDelete] = useState(null);  // Lưu category cần xóa

    useEffect(() => {
        dispatch(getCategoriesContent());  // Lấy danh sách categories
    }, [dispatch]);

    const deleteCategoryHandler = () => {
        if (categoryToDelete) {
            dispatch(deleteCategory(categoryToDelete.id))
                .then(() => {
                    setMessage('Category deleted successfully!');
                    setTimeout(() => setMessage(''), 3000);
                    setIsDeleteConfirmOpen(false); // Đóng modal xác nhận sau khi xóa thành công
                    setCategoryToDelete(null); // Reset categoryToDelete
                })
                .catch((error) => {
                    setMessage('Error deleting category');
                    setTimeout(() => setMessage(''), 3000);
                });
        }
    };

    const handleCreateCategory = () => {
        const action = isEdit ? updateCategory : createCategory;

        // Kiểm tra nếu categoryName đã tồn tại trong danh sách categories khi tạo mới
        if (!isEdit) {
            const categoryExists = categories.some(category => category.categoryName.toLowerCase() === categoryForm.categoryName.toLowerCase());
            
            if (categoryExists) {
                setErrorMessage("Category already exists."); // Hiển thị lỗi nếu category đã tồn tại trong modal
                return;
            }
        }

        dispatch(action(categoryForm))
            .then(() => {
                setMessage(isEdit ? 'Category updated successfully!' : 'Category created successfully!');
                resetForm();
                setTimeout(() => setMessage(''), 3000);
            })
            .catch((error) => {
                if (error?.response?.data?.error === "Category already exists.") {
                    setErrorMessage("Category already exists."); // Hiển thị lỗi khi category đã tồn tại
                } else {
                    setErrorMessage("An error occurred. Please try again.");
                }
                setTimeout(() => setErrorMessage(''), 3000); // Tắt thông báo lỗi sau 3 giây
            });
    };

    const resetForm = () => {
        setCategoryForm({
            id: '',
            categoryName: '',
            categoryDescription: '',
            subCategories: [{ subCategoryName: '', subCategoryDescription: '' }]  // Reset lại dữ liệu form
        });
        setIsEdit(false);
        setIsCreateModalOpen(false);  // Đóng modal sau khi tạo hoặc sửa
    };

    const handleCategoryChange = (e) => {
        const { name, value } = e.target;
        setCategoryForm({
            ...categoryForm,
            [name]: value
        });
    };

    const handleSubCategoryChange = (index, e) => {
        const { name, value } = e.target;
        const newSubCategories = [...categoryForm.subCategories];
        newSubCategories[index] = { ...newSubCategories[index], [name]: value }; // Cập nhật cả subCategoryName và subCategoryDescription
        setCategoryForm({
            ...categoryForm,
            subCategories: newSubCategories
        });
    };

    const handleAddSubCategory = () => {
        setCategoryForm({
            ...categoryForm,
            subCategories: [...categoryForm.subCategories, { subCategoryName: '', subCategoryDescription: '' }]  // Thêm cả subCategoryName và subCategoryDescription
        });
    };

    const handleRemoveSubCategory = (index) => {
        const newSubCategories = categoryForm.subCategories.filter((_, i) => i !== index);
        setCategoryForm({
            ...categoryForm,
            subCategories: newSubCategories
        });
    };

    const handleEditCategory = (category) => {
        setCategoryForm({
            id: category.id,
            categoryName: category.categoryName,
            categoryDescription: category.categoryDescription,
            subCategories: category.subCategories || [{ subCategoryName: '', subCategoryDescription: '' }]  // Lấy cả subCategoryName và subCategoryDescription
        });
        setIsEdit(true);
        setIsCreateModalOpen(true);
    };

    const handleDeleteCategory = (category) => {
        setCategoryToDelete(category);  // Lưu category cần xóa
        setIsDeleteConfirmOpen(true);  // Mở modal xác nhận xóa
    };

    return (
        <div className="min-h-screen bg-gray-100 py-6 px-4">
            <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-8">

                {/* Nút Create New Category */}
                <div className="mb-6 text-right relative group">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-orange-500 text-white p-3 rounded-full hover:bg-orange-700 transition duration-200"
                    >
                        <PlusIcon className="w-5 h-5 inline-block" />
                    </button>
                    {/* Thêm text "Add new Category" khi hover */}
                    <span className="absolute left-1/2 transform -translate-x-1/2 top-12 text-sm text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Add new Category
                    </span>
                </div>

                {/* Hiển thị thông báo thành công trên trang Cate */}
                {message && !isCreateModalOpen && (
                    <div className={`p-4 mb-4 fixed top-20 left-1/2 transform -translate-x-1/2 rounded-lg text-center 
                        ${message.includes('Error') ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`} >
                        {message}
                    </div>
                )}

                {/* Hiển thị bảng Categories */}
                <div className="overflow-x-auto">
                    <table className="table-auto w-full bg-white shadow-md rounded-lg">
                        <thead>
                            <tr className="bg-gray-200 text-left text-sm font-semibold text-gray-700">
                                <th className="px-4 py-2">No</th>
                                <th className="px-4 py-2">Category Name</th>
                                <th className="px-4 py-2">Description</th>
                                <th className="px-4 py-2">Sub Categories</th>
                                <th className="px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                categories.length > 0 ? categories.map((category, index) => (
                                    <tr key={category.id} className="border-t">
                                        <td className="px-4 py-2 text-sm text-gray-700">{index + 1}</td>
                                        <td className="px-4 py-2 text-sm text-gray-700">{category.categoryName}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600">{category.categoryDescription}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                            <ul>
                                                {
                                                    category.subCategories.length > 0 ? category.subCategories.map((subCategory, subIndex) => (
                                                        <li key={subCategory.id} className="text-sm text-gray-600">
                                                            {subIndex + 1}. {subCategory.subCategoryName}
                                                        </li>
                                                    )) : (
                                                        <li className="text-sm text-gray-600">No subcategories</li>
                                                    )
                                                }
                                            </ul>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-center">
                                            <button
                                                className="bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-700 transition duration-200"
                                                onClick={() => handleEditCategory(category)}
                                            >
                                                <PencilIcon className="w-5 h-5 inline-block" />
                                            </button>
                                            <button
                                                className="bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-700 transition duration-200 ml-2"
                                                onClick={() => handleDeleteCategory(category)} // Gọi hàm xóa
                                            >
                                                <TrashIcon className="w-5 h-5 inline-block" />
                                            </button>
                                        </td>
                                    </tr>
                                )) :
                                <tr>
                                    <td colSpan="5" className="text-center text-gray-600 py-4">No categories available</td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Create or Edit Category */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white rounded-xl p-8 w-full sm:w-96 lg:w-1/2 shadow-lg transition-all ease-in-out transform duration-300 overflow-y-auto max-h-[80vh]">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">{isEdit ? 'Edit Category' : 'Create New Category'}</h3>

                        {/* Category Name */}
                        <div className="mb-4">
                            <label htmlFor="categoryName" className="block text-sm text-gray-700">Category Name</label>
                            <input
                                id="categoryName"
                                type="text"
                                name="categoryName"
                                value={categoryForm.categoryName}
                                onChange={handleCategoryChange}
                                className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 ease-in-out"
                                placeholder="Enter Category Name"
                            />
                        </div>

                        {/* Hiển thị thông báo lỗi nếu category đã tồn tại */}
                        {errorMessage && (
                            <div className="p-4 mb-4 bg-yellow-200 text-yellow-800 rounded-lg text-center">
                                {errorMessage}
                            </div>
                        )}

                        {/* Category Description */}
                        <div className="mb-4">
                            <label htmlFor="categoryDescription" className="block text-sm text-gray-700">Category Description</label>
                            <textarea
                                id="categoryDescription"
                                name="categoryDescription"
                                value={categoryForm.categoryDescription}
                                onChange={handleCategoryChange}
                                className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 ease-in-out"
                                placeholder="Enter Category Description"
                            />
                        </div>

                        {/* Sub Categories */}
                        <div className="mb-4">
                            <label className="block text-sm text-gray-700">Sub Categories</label>
                            {categoryForm.subCategories.map((subCategory, index) => (
                                <div key={index} className="flex space-x-4 mt-4">
                                    <input
                                        type="text"
                                        name="subCategoryName"
                                        value={subCategory.subCategoryName}
                                        onChange={(e) => handleSubCategoryChange(index, e)}
                                        placeholder="Sub Category Name"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 ease-in-out"
                                    />
                                    <textarea
                                        name="subCategoryDescription"
                                        value={subCategory.subCategoryDescription}
                                        onChange={(e) => handleSubCategoryChange(index, e)}
                                        placeholder="Sub Category Description"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 ease-in-out"
                                    />
                                    <button
                                        onClick={() => handleRemoveSubCategory(index)}
                                        className="text-red-500 hover:text-red-700 mt-4"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={handleAddSubCategory}
                                className="mt-4 w-full bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-700 transition duration-200"
                            >
                                Add Sub Category
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 flex justify-between">
                            <button
                                onClick={handleCreateCategory}
                                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition duration-200 w-full sm:w-auto"
                            >
                                {isEdit ? 'Update Category' : 'Create Category'}
                            </button>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition duration-200 w-full sm:w-auto"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Confirm Delete */}
            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white rounded-lg p-6 w-full sm:w-96 shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Are you sure you want to delete this category?</h3>

                        <div className="flex justify-around mt-4">
                            <button
                                onClick={deleteCategoryHandler}
                                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition duration-200 w-24"
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setIsDeleteConfirmOpen(false)}
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
}

export default Categories;
