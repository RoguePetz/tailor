import { doc, setDoc } from 'firebase/firestore';
import { useState, useRef } from 'react';
import { db } from '../firebase-config';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AddModal = ({ isOpen, onClose, fetchCustomers }) => {
  const storage = getStorage();
  const defaultMeasurements = [
    "Shoulder circ",
    "Upper bust circ",
    "Bust circ",
    "Under Bust circ",
    "Waist circ",
    "Upper hip circ",
    "Hip circ",
    "Thigh circ",
    "Knee circ",
    "Calf circ",
    "Ankle circ",
    "Armscye ",
    "Bicep circ",
    "Elbow circ",
    "Wrist circ",
    "Across Shoulder ",
    "Across Back",
    "Across Chest",
    "Bust Span",
    "Soulder - Bust Point",
    "Shoulder - Under bust ",
    "Shoulder - waistline",
    "Waistline - Hip line ",
    "Waistline - knee line",
    "Waistline - floor",
    "Shoulder - floor (full length) ",
    "Back half length ",
    "Front half length ",
    "Sleeve length ",
    "Inseam",
    "Body rise / Crotch depth",
    "Desired Top length ",
    "Pant length ",
    "Skirt length ",
    "Shoulder to Elbow ",
    "Head circ",
    "Neck cir"
  ];

  const [customerDetails, setCustomerDetails] = useState({
    customerName: '',
    contactNumber: '',
    notes: ''
  });
  const [measurements, setMeasurements] = useState(defaultMeasurements.map((part) => ({ part, value: "" })));
  const [activeTab, setActiveTab] = useState('details');
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [additionalImages, setAdditionalImages] = useState([]);
  const [additionalPreviews, setAdditionalPreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const profileInputRef = useRef(null);
  const additionalInputRef = useRef(null);

  const handleCustomerDetailChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMeasurement = () => {
    setMeasurements(prev => [...prev, { part: '', value: '' }]);
  };

  const handleMeasurementChange = (index, field, value) => {
    const newMeasurements = [...measurements];
    newMeasurements[index][field] = value;
    setMeasurements(newMeasurements);
  };

  const handleRemoveMeasurement = (index) => {
    const newMeasurements = [...measurements];
    newMeasurements.splice(index, 1);
    setMeasurements(newMeasurements);
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + additionalImages.length > 4) {
      alert('Maximum 4 additional images allowed');
      return;
    }

    const newImages = [...additionalImages, ...files];
    setAdditionalImages(newImages);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setAdditionalPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeProfileImage = () => {
    if (profilePreview) {
      URL.revokeObjectURL(profilePreview);
    }
    setProfileImage(null);
    setProfilePreview('');
  };

  const removeAdditionalImage = (index) => {
    const newImages = [...additionalImages];
    newImages.splice(index, 1);
    setAdditionalImages(newImages);

    const newPreviews = [...additionalPreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setAdditionalPreviews(newPreviews);
  };

  const uploadImage = async (file, path) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
  
    try {
      if (!customerDetails.customerName || !/^[a-zA-Z0-9_-]+$/.test(customerDetails.customerName)) {
        throw new Error('Customer name is required and can only contain letters, numbers, underscores, and hyphens');
      }

      let profileImageUrl = '';
      if (profileImage) {
        profileImageUrl = await uploadImage(
          profileImage, 
          `customers/${customerDetails.customerName}/profile/${profileImage.name}`
        );
      }

      const additionalImageUrls = [];
      for (const image of additionalImages) {
        const url = await uploadImage(
          image, 
          `customers/${customerDetails.customerName}/additional/${image.name}`
        );
        additionalImageUrls.push(url);
      }

      const customerData = {
        ...customerDetails,
        measurements,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (profileImageUrl) {
        customerData.profileImageUrl = profileImageUrl;
      }

      if (additionalImageUrls.length > 0) {
        customerData.additionalImageUrls = additionalImageUrls;
      }

      await setDoc(doc(db, "customers", customerDetails.customerName), customerData);
      
      // Refresh the customer list
      await fetchCustomers();
      
      // Reset form and close modal
      setCustomerDetails({
        customerName: '',
        contactNumber: '',
        notes: ''
      });
      setMeasurements([]);
      setProfileImage(null);
      setProfilePreview('');
      setAdditionalImages([]);
      setAdditionalPreviews([]);
      fetchCustomers()
      onClose();
    } catch (error) {
      console.error("Error saving customer data:", error);
      alert(`Error saving data: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Client Details
          </button>
          <button 
            className={`tab-btn ${activeTab === 'measurements' ? 'active' : ''}`}
            onClick={() => setActiveTab('measurements')}
          >
            Measurements
          </button>
        </div>

        <div className="modal-content-scrollable">
          <form onSubmit={handleSubmit}>
            {activeTab === 'measurements' ? (
              <div className="measurements-container">
                <button 
                  type="button" 
                  className="add-measurement-btn"
                  onClick={handleAddMeasurement}
                >
                  + Add Measurement
                </button>
                
                {measurements.map((measurement, index) => (
                  <div key={index} className="measurement-row">
                    <div className="input-group">
                      <input
                        type="text"
                        placeholder="Body part (e.g. Chest)"
                        value={measurement.part}
                        onChange={(e) => handleMeasurementChange(index, 'part', e.target.value)}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <div className="input-wrapper">
                        <input
                          type="number"
                          placeholder="Value"
                          value={measurement.value}
                          onChange={(e) => handleMeasurementChange(index, 'value', e.target.value)}
                          min="0"
                          step="0.25"
                          required
                        />
                        <span className="unit">in</span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      className="remove-measurement-btn"
                      onClick={() => handleRemoveMeasurement(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="client-details">
                <div className="profile-section">
                  {/* <div className="profile-image-container">
                    {profilePreview ? (
                      <div className="profile-preview-wrapper">
                        <img src={profilePreview} alt="Profile Preview" className="profile-preview" />
                        <button 
                          type="button" 
                          className="remove-profile-btn"
                          onClick={removeProfileImage}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="profile-upload-placeholder"
                        onClick={() => profileInputRef.current.click()}
                      >
                        <span>+ Add Profile Photo</span>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={profileInputRef}
                      onChange={handleProfileImageChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </div> */}

                  <div className="profile-fields">
                    <div className="input-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        name="customerName"
                        value={customerDetails.customerName}
                        onChange={handleCustomerDetailChange}
                        required
                      />
                    </div>
                    
                    <div className="input-group">
                      <label>Contact Number</label>
                      <input
                        type="tel"
                        name="contactNumber"
                        value={customerDetails.contactNumber}
                        onChange={handleCustomerDetailChange}
                      />
                    </div>
                  </div>
                </div>

                {/* <div className="input-group">
                  <label>Additional Photos (Max 4)</label>
                  <div className="additional-images-container">
                    <button 
                      type="button"
                      className="upload-btn"
                      onClick={() => additionalInputRef.current.click()}
                      disabled={additionalImages.length >= 4}
                    >
                      + Add Photos
                    </button>
                    <input
                      type="file"
                      ref={additionalInputRef}
                      onChange={handleAdditionalImagesChange}
                      multiple
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={additionalImages.length >= 4}
                    />
                    
                    <div className="additional-previews">
                      {additionalPreviews.map((url, index) => (
                        <div key={index} className="additional-preview">
                          <img src={url} alt={`Additional ${index}`} />
                          <button 
                            type="button"
                            className="remove-image-btn"
                            onClick={() => removeAdditionalImage(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div> */}

                <div className="input-group">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={customerDetails.notes}
                    onChange={handleCustomerDetailChange}
                    rows="4"
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-btn" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Measurements'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddModal;
