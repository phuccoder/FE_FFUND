import React, { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { fetchProvinces, fetchDistrictsByProvince, fetchWardsByDistrict } from "../../services/userAddress";
import { toast } from "react-toastify";

export default function AddressSelector({ addresses, selectedAddress, onSelectAddress, onAddAddress, onEditAddress, onDeleteAddress }) {
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [newAddress, setNewAddress] = useState({
    address: "",
    province: "",
    district: "",
    ward: "",
    note: "",
    default: false
  });
  const [errors, setErrors] = useState({});

  // Fetch provinces when the component loads
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const fetchedProvinces = await fetchProvinces();
        setProvinces(fetchedProvinces);
      } catch (error) {
        toast.error("Failed to load provinces.");
      }
    };
    loadProvinces();
  }, []);

  // Fetch districts when a province is selected
  useEffect(() => {
    const loadDistricts = async () => {
      if (selectedProvince) {
        try {
          const fetchedDistricts = await fetchDistrictsByProvince(selectedProvince);
          setDistricts(fetchedDistricts);
        } catch (error) {
          toast.error("Failed to load districts.");
        }
      }
    };
    loadDistricts();
  }, [selectedProvince]);

  // Fetch wards when a district is selected
  useEffect(() => {
    const loadWards = async () => {
      if (selectedDistrict) {
        try {
          const fetchedWards = await fetchWardsByDistrict(selectedDistrict);
          setWards(fetchedWards);
        } catch (error) {
          toast.error("Failed to load wards.");
        }
      }
    };
    loadWards();
  }, [selectedDistrict]);

  const handleCloseModal = () => {
    setShowAddressModal(false);
    setNewAddress({
      address: "",
      province: "",
      district: "",
      ward: "",
      note: "",
      default: false
    });
    setSelectedProvince("");
    setSelectedDistrict("");
    setSelectedWard("");
    setErrors({});
  };

  const handleShowModal = () => setShowAddressModal(true);

  const handleProvinceChange = (value) => {
    setSelectedProvince(value);
    setSelectedDistrict("");
    setSelectedWard("");
    setDistricts([]);
    setWards([]);
    setNewAddress((prev) => ({
      ...prev,
      province: provinces.find((province) => province.code === value)?.name || "",
      district: "",
      ward: ""
    }));
  };

  const handleDistrictChange = (value) => {
    setSelectedDistrict(value);
    setSelectedWard("");
    setWards([]);
    setNewAddress((prev) => ({
      ...prev,
      district: districts.find((district) => district.code === value)?.name || "",
      ward: ""
    }));
  };

  const handleWardChange = (value) => {
    setSelectedWard(value);
    setNewAddress((prev) => ({
      ...prev,
      ward: wards.find((ward) => ward.code === value)?.name || ""
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress({
      ...newAddress,
      [name]: type === 'checkbox' ? checked : value
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateAddress = () => {
    const newErrors = {};

    if (!newAddress.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!newAddress.province.trim()) {
      newErrors.province = 'Province is required';
    }

    if (!newAddress.district.trim()) {
      newErrors.district = 'District is required';
    }

    if (!newAddress.ward.trim()) {
      newErrors.ward = 'Ward is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditClick = (address, e) => {
    e.stopPropagation();

    if (!address || !address.id) {
      toast.error("Cannot edit address: Missing address ID");
      return;
    }
    const addressCopy = { ...address };

    console.log("Editing address with ID:", addressCopy.id);

    setAddressToEdit(addressCopy);
    setShowEditModal(true);
  };

  const handleDeleteClick = async (address, e) => {
    e.stopPropagation(); // Prevent address selection when clicking delete

    if (address.isDefault) {
      toast.error("Cannot delete default address");
      return;
    }

    if (window.confirm("Are you sure you want to delete this address?")) {
      setIsLoading(true);
      try {
        await onDeleteAddress(address.id);
        toast.success("Address deleted successfully");
      } catch (err) {
        console.error("Error deleting address:", err);
        toast.error("Failed to delete address");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
  
    // Check for address ID first
    if (!addressToEdit?.id) {
      toast.error("Address ID is missing. Cannot update address.");
      return;
    }
  
    const validateEditAddress = () => {
      const newErrors = {};
  
      if (!addressToEdit?.address?.trim()) {
        newErrors.address = 'Address is required';
      }
  
      if (!addressToEdit?.province?.trim()) {
        newErrors.province = 'Province is required';
      }
  
      if (!addressToEdit?.district?.trim()) {
        newErrors.district = 'District is required';
      }
  
      if (!addressToEdit?.ward?.trim()) {
        newErrors.ward = 'Ward is required';
      }
  
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  
    if (!validateEditAddress()) {
      return;
    }
  
    setIsLoading(true);
    try {
      const addressId = addressToEdit.id;

      const addressData = {
        address: addressToEdit.address,
        province: addressToEdit.province,
        district: addressToEdit.district,
        ward: addressToEdit.ward,
        note: addressToEdit.note || "",
        default: addressToEdit.isDefault || false
      };
  
      console.log("Updating address with ID:", addressId);
      console.log("Address data:", addressData);

      const success = await onEditAddress(addressId, addressData);
      
      if (success) {
        setShowEditModal(false);
        setAddressToEdit(null);
        setErrors({});
        toast.success("Address updated successfully");
      }
    } catch (err) {
      console.error("Error updating address:", err);
      toast.error("Failed to update address");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setAddressToEdit(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAddress()) {
      return;
    }

    const success = await onAddAddress(newAddress);
    if (success) {
      handleCloseModal();
    }
  };

  return (
    <div>
      <h3 className="text-md font-medium mb-3">Select Delivery Address</h3>
      {addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              onClick={() => onSelectAddress(address)}
              className={`border p-3 rounded-md cursor-pointer ${selectedAddress?.id === address.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="flex justify-between">
                <div className="font-medium">{address.address}</div>
                <div className="flex space-x-2">
                  {address.isDefault && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Default
                    </span>
                  )}

                  {/* Add Edit and Delete buttons */}
                  <button
                    onClick={(e) => handleEditClick(address, e)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    disabled={isLoading}
                  >
                    Edit
                  </button>

                  {!address.isDefault && (
                    <button
                      onClick={(e) => handleDeleteClick(address, e)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      disabled={isLoading}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {address.ward}, {address.district}
              </p>
              <p className="text-sm text-gray-600">
                {address.province}
              </p>
              <p className="text-sm text-gray-600 mt-1">{address.note}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 bg-gray-50 rounded-md mb-4">
          <p className="text-gray-500">No addresses found</p>
        </div>
      )}

      <button
        onClick={handleShowModal}
        className="mt-4 flex items-center text-blue-600 hover:text-blue-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Add New Address
      </button>

      {/* Add New Address Modal */}
      <Modal show={showAddressModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Address</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                placeholder="Enter detailed address"
                value={newAddress.address}
                onChange={handleInputChange}
                isInvalid={!!errors.address}
              />
              <Form.Control.Feedback type="invalid">
                {errors.address}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Province</Form.Label>
              <Form.Select
                value={selectedProvince}
                onChange={(e) => handleProvinceChange(e.target.value)}
                isInvalid={!!errors.province}
              >
                <option value="">Select Province</option>
                {provinces.map((province) => (
                  <option key={province.code} value={province.code}>
                    {province.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.province}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>District</Form.Label>
              <Form.Select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                disabled={!selectedProvince}
                isInvalid={!!errors.district}
              >
                <option value="">Select District</option>
                {districts.map((district) => (
                  <option key={district.code} value={district.code}>
                    {district.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.district}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Ward</Form.Label>
              <Form.Select
                value={selectedWard}
                onChange={(e) => handleWardChange(e.target.value)}
                disabled={!selectedDistrict}
                isInvalid={!!errors.ward}
              >
                <option value="">Select Ward</option>
                {wards.map((ward) => (
                  <option key={ward.code} value={ward.code}>
                    {ward.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.ward}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Note (Optional)</Form.Label>
              <Form.Control
                type="text"
                name="note"
                placeholder="Enter note (optional)"
                value={newAddress.note}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="default-address"
                name="default"
                checked={newAddress.default}
                onChange={handleInputChange}
                label="Set as default address"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Save Address
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Address Modal */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Address</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdateAddress}>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                placeholder="Enter detailed address"
                value={addressToEdit?.address || ''}
                onChange={(e) => setAddressToEdit({ ...addressToEdit, address: e.target.value })}
                isInvalid={!!errors.address}
                disabled={isLoading}
              />
              <Form.Control.Feedback type="invalid">
                {errors.address}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Province</Form.Label>
              <Form.Control
                type="text"
                name="province"
                placeholder="Province"
                value={addressToEdit?.province || ''}
                onChange={(e) => setAddressToEdit({ ...addressToEdit, province: e.target.value })}
                isInvalid={!!errors.province}
                disabled={isLoading}
              />
              <Form.Control.Feedback type="invalid">
                {errors.province}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>District</Form.Label>
              <Form.Control
                type="text"
                name="district"
                placeholder="District"
                value={addressToEdit?.district || ''}
                onChange={(e) => setAddressToEdit({ ...addressToEdit, district: e.target.value })}
                isInvalid={!!errors.district}
                disabled={isLoading}
              />
              <Form.Control.Feedback type="invalid">
                {errors.district}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Ward</Form.Label>
              <Form.Control
                type="text"
                name="ward"
                placeholder="Ward"
                value={addressToEdit?.ward || ''}
                onChange={(e) => setAddressToEdit({ ...addressToEdit, ward: e.target.value })}
                isInvalid={!!errors.ward}
                disabled={isLoading}
              />
              <Form.Control.Feedback type="invalid">
                {errors.ward}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Phone Number field removed */}

            <Form.Group className="mb-3">
              <Form.Label>Note (Optional)</Form.Label>
              <Form.Control
                type="text"
                name="note"
                placeholder="Enter note (optional)"
                value={addressToEdit?.note || ''}
                onChange={(e) => setAddressToEdit({ ...addressToEdit, note: e.target.value })}
                disabled={isLoading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="default-address-edit"
                name="isDefault"
                checked={addressToEdit?.isDefault || false}
                onChange={(e) => setAddressToEdit({ ...addressToEdit, isDefault: e.target.checked })}
                label="Set as default address"
                disabled={isLoading}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEditModal} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateAddress} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Address'}
          </Button>
          {addressToEdit && !addressToEdit.isDefault && (
            <Button variant="danger" onClick={(e) => {
              handleCloseEditModal();
              handleDeleteClick(addressToEdit, e);
            }} disabled={isLoading}>
              Delete
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}