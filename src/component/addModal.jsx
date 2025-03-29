import { doc, setDoc } from 'firebase/firestore';
import { useState, useRef } from 'react';
import { db } from '../firebase-config';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AddModal = ({ isOpen, onClose, fetchCustomers }) => {
  const storage = getStorage();
  const defaultTopMeasurements = [
    "Head circ",
    "Neck cir",
    "Shoulder circ",
    "Upper bust circ",
    "Bust circ",
    "Under Bust circ",
    "Bust Span",
    "Armscye ",
    "Sleeve length ",
    "Bicep circ",
    "Elbow circ",
    "Wrist circ",
    "Across Shoulder ",
    "Across Back",
    "Across Chest",
    "Shoulder - Bust Point",
    "Shoulder - Under bust ",
    "Shoulder - waistline",
    "Shoulder - Elbow ",
    "Back half length ",
    "Front half length ",
    "Waist circ",
    "Desired Top length ",
  ];
  const defaultBottomMeasurements = [
    "Waistline - Hip line ",
    "Waistline - knee line",
    "Waistline - floor",
    "Shoulder - floor (full length) ",
    "Shoulder - hip",
    "Shoulder - knee",
    "Upper hip circ",
    "Hip circ",
    "Thigh circ",
    "Knee circ",
    "Calf circ",
    "Ankle circ",
    "Inseam",
    "Body rise / Crotch depth",
    "Pant length ",
    "Skirt length ",
  ];

  const [customerDetails, setCustomerDetails] = useState({
    customerName: '',
    contactNumber: '',
    notes: ''
  });
  const [topMeasurements, setTopMeasurements] = useState(defaultTopMeasurements.map((part) => ({ part, value: "" })));
  const [bottomMeasurements, setBottomMeasurements] = useState(defaultBottomMeasurements.map((part) => ({ part, value: "" })));

  // State to track collapsibility
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

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

  const handleAddMeasurement = (section) => {
    if (section === "top") {
      setTopMeasurements(prev => [...prev, { part: "", value: "" }]); 
    } else if (section === "bottom") {
      setBottomMeasurements(prev => [...prev, { part: "", value: "" }]); 
    }
  };

  const handleMeasurementChange = (index, key, value, section) => {
    if (section === "top") {
      setTopMeasurements(prev => {
        const newMeasurements = [...prev];
        newMeasurements[index][key] = value;
        return newMeasurements;
      });
    } else if (section === "bottom") {
      setBottomMeasurements(prev => {
        const newMeasurements = [...prev];
        newMeasurements[index][key] = value;
        return newMeasurements;
      });
    }
  };

  const handleRemoveMeasurement = (index, section) => {
    if (section === "top") {
      setTopMeasurements((prev) => prev.filter((_, i) => i !== index));
    } else {
      setBottomMeasurements((prev) => prev.filter((_, i) => i !== index));
    }
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

      const measurements = [...topMeasurements, ...bottomMeasurements];

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
      setTopMeasurements([]);
      setBottomMeasurements([]);
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

              {/* Top Measurements Section */}
              <div 
              className={`section-header ${showTop ? "expanded" : ""}`} 
              onClick={() => setShowTop(!showTop)}
              >
              Top Measurements <span className="arrow">{showTop ? "▼" : "▶"}</span>
              </div>
              {showTop && (
                <div className={`measurement-list ${showBottom ? "show" : ""}`}>
                {topMeasurements.map((measurement, index) => (
                  <div key={index} className="measurement-row">
                  <div className="input-group">
                  <input 
                  type="text" 
                  placeholder="Body part (e.g. Chest)"
                  value={measurement.part} 
                  onChange={(e) => handleMeasurementChange(index, "part", e.target.value, "top")}
                  required 
                  />
                  </div>
                  <div className="input-group">
                  <div className="input-wrapper">
                  <input
                  type="number"
                  placeholder="Value"
                  value={measurement.value}
                  onChange={(e) => handleMeasurementChange(index, "value", e.target.value, "top")}
                  min="0"
                  step="0.25"
                  required
                  />
                  <span className="unit">in</span>
                  </div>
                  </div>
                  <button type="button" className="remove-measurement-btn" onClick={() => handleRemoveMeasurement(index, "top")}>
                  ×
                  </button>
                  </div>
                ))}
                </div>
              )}

              {/* Bottom Measurements Section */}
              <div 
              className={`section-header ${showBottom ? "expanded" : ""}`} 
              onClick={() => setShowBottom(!showBottom)}
              >
              Bottom Measurements <span className="arrow">{showBottom ? "▼" : "▶"}</span>
              </div>
              {showBottom && (
                <div className="measurement-list">
                {bottomMeasurements.map((measurement, index) => (
                  <div key={index} className="measurement-row">
                  <div className="input-group">
                  <input 
                  type="text" 
                  placeholder="Body part (e.g. Legs)"
                  value={measurement.part} 
                  onChange={(e) => handleMeasurementChange(index, "part", e.target.value, "bottom")}
                  required 
                  />
                  </div>
                  <div className="input-group">
                  <div className="input-wrapper">
                  <input
                  type="number"
                  placeholder="Value"
                  value={measurement.value}
                  onChange={(e) => handleMeasurementChange(index, "value", e.target.value, "bottom")}
                  min="0"
                  step="0.25"
                  required
                  />
                  <span className="unit">in</span>
                  </div>
                  </div>
                  <button type="button" className="remove-measurement-btn" onClick={() => handleRemoveMeasurement(index, "bottom")}>
                  ×
                  </button>
                  </div>
                ))}

                </div>
              )}

                  <div>
                    <button 
                      type="button" 
                      className="add-measurement-btn"
                      onClick={() => handleAddMeasurement("top")}
                    >
                      + Add Top Measurement
                    </button>
                    <button 
                      type="button" 
                      className="add-measurement-btn"
                      onClick={() => handleAddMeasurement("bottom")}
                    >
                      + Add Bottom Measurement
                    </button>
                  </div>
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
