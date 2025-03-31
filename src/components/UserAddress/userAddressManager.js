import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
    fetchProvinces,
    fetchDistrictsByProvince,
    fetchWardsByDistrict,
    createUserAddress,
    getUserAddress,
    deleteUserAddress,
    updateUserAddress
} from "../../services/userAddress";
import { FaEdit, FaTrash } from "react-icons/fa";
import { Card, Button, Modal, Form } from "react-bootstrap";

const UserAddressManager = () => {
    const [addresses, setAddresses] = useState([]);
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
    const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
    const [isEditAddressModalOpen, setIsEditAddressModalOpen] = useState(false);
    const [isDeleteWarningModalOpen, setIsDeleteWarningModalOpen] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [deletingAddressId, setDeletingAddressId] = useState(null);

    // Fetch user addresses
    const loadUserAddresses = async () => {
        try {
            const fetchedAddresses = await getUserAddress();
            setAddresses(fetchedAddresses || []);
        } catch (error) {
            console.error("Error loading user addresses:", error);
            toast.error("Failed to load your addresses.");
        }
    };

    useEffect(() => {
        loadUserAddresses();
    }, []);

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

    const handleAddAddress = async () => {
        try {
            const response = await createUserAddress(newAddress);
            if (response.status === 201) {
                toast.success("Address added successfully.");
                setIsAddAddressModalOpen(false);

                // Reset form
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

                // Reload addresses to update default status
                await loadUserAddresses();
            }
        } catch (error) {
            toast.error("Failed to add address.");
        }
    };

    const handleEditAddress = (address) => {
        setEditingAddressId(address.id);
        setNewAddress({
            address: address.address,
            province: address.province,
            district: address.district,
            ward: address.ward,
            note: address.note,
            default: address.isDefault
        });
        setSelectedProvince(provinces.find((p) => p.name === address.province)?.code || "");
        setSelectedDistrict(districts.find((d) => d.name === address.district)?.code || "");
        setSelectedWard(wards.find((w) => w.name === address.ward)?.code || "");
        setIsEditAddressModalOpen(true);
    };

    const handleUpdateAddress = async () => {
        try {
            const response = await updateUserAddress(editingAddressId, newAddress);
            if (response) {
                toast.success("Address updated successfully.");
                setIsEditAddressModalOpen(false);

                // Reset form
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

                // Reload addresses to update default status
                await loadUserAddresses();
            }
        } catch (error) {
            toast.error("Failed to update address.");
        }
    };

    const handleDeleteAddress = async () => {
        try {
            await deleteUserAddress(deletingAddressId);
            toast.success("Address deleted successfully.");
            setIsDeleteWarningModalOpen(false);
            await loadUserAddresses();
        } catch (error) {
            toast.error("Failed to delete address.");
        }
    };

    const confirmDeleteAddress = (addressId, isDefault) => {
        if (isDefault) {
            toast.error("You cannot delete the default address. Please set another address as default first.");
            return;
        }
        setDeletingAddressId(addressId);
        setIsDeleteWarningModalOpen(true);
    };

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="text-2xl font-bold">Address Management</h1>
                <Button variant="primary" onClick={() => setIsAddAddressModalOpen(true)}>
                    Add New Address
                </Button>
            </div>

            {/* Address List */}
            <div className="mb-4">
                {addresses.map((address, index) => (
                    <Card key={address.id} className="mb-3">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <span>
                                Address {index + 1} {address.isDefault && <span className="text-success">(Default)</span>}
                            </span>
                            <div className="d-flex gap-2">
                                <Button
                                    variant="warning"
                                    className="p-1"
                                    onClick={() => handleEditAddress(address)}
                                >
                                    <FaEdit size={18} />
                                </Button>
                                <Button
                                    variant="danger"
                                    className="p-1"
                                    onClick={() => confirmDeleteAddress(address.id, address.isDefault)}
                                    disabled={address.isDefault}
                                    style={address.isDefault ? { cursor: "not-allowed", opacity: 0.6 } : {}}
                                    title={address.isDefault ? "Cannot delete default address" : ""}
                                >
                                    <FaTrash size={18} />
                                </Button>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <p><strong>Address:</strong> {address.address}</p>
                            <p><strong>Province:</strong> {address.province}</p>
                            <p><strong>District:</strong> {address.district}</p>
                            <p><strong>Ward:</strong> {address.ward}</p>
                            <p><strong>Note:</strong> {address.note || "None"}</p>
                        </Card.Body>
                    </Card>
                ))}
            </div>

            {/* Add Address Modal */}
            <Modal show={isAddAddressModalOpen} onHide={() => setIsAddAddressModalOpen(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Address</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Address</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter detailed address"
                                value={newAddress.address}
                                onChange={(e) =>
                                    setNewAddress((prev) => ({ ...prev, address: e.target.value }))
                                }
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Province</Form.Label>
                            <Form.Select
                                value={selectedProvince}
                                onChange={(e) => handleProvinceChange(e.target.value)} // Gọi handleProvinceChange
                            >
                                <option value="">Select Province</option>
                                {provinces.map((province) => (
                                    <option key={province.code} value={province.code}>
                                        {province.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>District</Form.Label>
                            <Form.Select
                                value={selectedDistrict}
                                onChange={(e) => handleDistrictChange(e.target.value)} // Gọi handleDistrictChange
                                disabled={!selectedProvince}
                            >
                                <option value="">Select District</option>
                                {districts.map((district) => (
                                    <option key={district.code} value={district.code}>
                                        {district.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Ward</Form.Label>
                            <Form.Select
                                value={selectedWard}
                                onChange={(e) => handleWardChange(e.target.value)} // Gọi handleWardChange
                                disabled={!selectedDistrict}
                            >
                                <option value="">Select Ward</option>
                                {wards.map((ward) => (
                                    <option key={ward.code} value={ward.code}>
                                        {ward.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Note</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter note (optional)"
                                value={newAddress.note}
                                onChange={(e) =>
                                    setNewAddress((prev) => ({ ...prev, note: e.target.value }))
                                }
                            />
                        </Form.Group>
                        <Form.Group className="mb-3 custom-switch">
                            <Form.Label>Set as Default Address</Form.Label>
                            <Form.Switch
                                id="default-address-switch"
                                label={newAddress.default ? "Default (On)" : "Not Default (Off)"}
                                checked={newAddress.default}
                                onChange={(e) =>
                                    setNewAddress((prev) => ({ ...prev, default: e.target.checked }))
                                }
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setIsAddAddressModalOpen(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleAddAddress}>
                        Add Address
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Address Modal */}
            <Modal show={isEditAddressModalOpen} onHide={() => setIsEditAddressModalOpen(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Address</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Address</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter detailed address"
                                value={newAddress.address}
                                onChange={(e) =>
                                    setNewAddress((prev) => ({ ...prev, address: e.target.value }))
                                }
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Province</Form.Label>
                            <Form.Select
                                value={selectedProvince}
                                onChange={(e) => handleProvinceChange(e.target.value)} // Gọi handleProvinceChange
                            >
                                <option value="">Select Province</option>
                                {provinces.map((province) => (
                                    <option key={province.code} value={province.code}>
                                        {province.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>District</Form.Label>
                            <Form.Select
                                value={selectedDistrict}
                                onChange={(e) => handleDistrictChange(e.target.value)} // Gọi handleDistrictChange
                                disabled={!selectedProvince}
                            >
                                <option value="">Select District</option>
                                {districts.map((district) => (
                                    <option key={district.code} value={district.code}>
                                        {district.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Ward</Form.Label>
                            <Form.Select
                                value={selectedWard}
                                onChange={(e) => handleWardChange(e.target.value)} // Gọi handleWardChange
                                disabled={!selectedDistrict}
                            >
                                <option value="">Select Ward</option>
                                {wards.map((ward) => (
                                    <option key={ward.code} value={ward.code}>
                                        {ward.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Note</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter note (optional)"
                                value={newAddress.note}
                                onChange={(e) =>
                                    setNewAddress((prev) => ({ ...prev, note: e.target.value }))
                                }
                            />
                        </Form.Group>
                        <Form.Group className="mb-3 custom-switch">
                            <Form.Label>Set as Default Address</Form.Label>
                            <Form.Switch
                                id="default-address-switch"
                                label={newAddress.default ? "Default (On)" : "Not Default (Off)"}
                                checked={newAddress.default}
                                onChange={(e) =>
                                    setNewAddress((prev) => ({ ...prev, default: e.target.checked }))
                                }
                                disabled={newAddress.default} // Khóa switch nếu địa chỉ đang là default
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setIsEditAddressModalOpen(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleUpdateAddress}>
                        Update Address
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Warning Modal */}
            <Modal show={isDeleteWarningModalOpen} onHide={() => setIsDeleteWarningModalOpen(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this address? This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setIsDeleteWarningModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDeleteAddress}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default UserAddressManager;