import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
import Nav from "../component/nav";
import AddModal from "../component/addModal";
import UpdateModal from '../component/updateModal';
function Home() {
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCustomers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "customers"));
      const customersData = [];
      
      querySnapshot.forEach((doc) => {
        customersData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setAllCustomers(customersData);
      setFilteredCustomers(customersData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching customers: ", err);
      setError("Failed to load customer data");
      setLoading(false);
    }
  };

  const handleFilter = (searchTerm) => {
    if (!searchTerm) {
      setFilteredCustomers(allCustomers);
      return;
    }

    const filtered = allCustomers.filter(customer => {
      const nameMatch = customer.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const contactMatch = customer.contactNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || contactMatch;
    });

    setFilteredCustomers(filtered);
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        setDeletingId(customerId);
        await deleteDoc(doc(db, "customers", customerId));
        await fetchCustomers();
      } catch (error) {
        console.error("Error deleting customer: ", error);
        alert('Failed to delete customer');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleAddClick = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <Nav 
          fetchCustomers={fetchCustomers} 
          onFilter={handleFilter} 
          onAddClick={handleAddClick}
        />
        <div className="loading-container">
          <p>Loading customer data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <Nav 
          fetchCustomers={fetchCustomers} 
          onFilter={handleFilter} 
          onAddClick={handleAddClick}
        />
        <div className="error-container">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Nav 
        fetchCustomers={fetchCustomers} 
        onFilter={handleFilter} 
        onAddClick={handleAddClick}
      />
      
      <AddModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        fetchCustomers={fetchCustomers}
        customerToEdit={editingCustomer}
      />
      <UpdateModal
        isOpen={isModalOpen && editingCustomer !== null}
        onClose={handleCloseModal}
        fetchCustomers={fetchCustomers}
        customerToEdit={editingCustomer}
      />
      <div className="cards-container">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="customer-card">
            <div className="card-header">
              <h3 className="customer-name">{customer.customerName}</h3>
              <div className="card-actions">
                {customer.contactNumber && (
                  <span className="contact-number">{customer.contactNumber}</span>
                )}
                <div className="action-buttons">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEditCustomer(customer)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteCustomer(customer.id)}
                    disabled={deletingId === customer.id}
                  >
                    {deletingId === customer.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {customer.measurements && customer.measurements.length > 0 ? (
                <div className="measurements-grid">
                  {customer.measurements.map((measurement, index) => (
                    <div key={index} className="measurement-item">
                      <span className="measurement-part">{measurement.part}:</span>
                      <span className="measurement-value">{measurement.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-measurements">No measurements recorded</p>
              )}
            </div>
            <div className="card-footer">
              <div className="meta-info">
                <span className="created-at">
                  Created: {new Date(customer.createdAt).toLocaleDateString()}
                </span>
                {customer.notes && (
                  <p className="customer-notes">{customer.notes}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;

// CSS Styles
const styles = `
  .page-container {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f5f6fa;
    min-height: 100vh;
  }

  .loading-container, .error-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: calc(100vh - 60px);
    font-size: 1.2rem;
    color: #555;
  }

  .error-container {
    color: #e74c3c;
  }

  .cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .customer-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .customer-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }

  .card-header {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    color: white;
    padding: 1.2rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
  }

  .edit-btn {
    background: #3498db;
    color: white;
    border: none;
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
  }

  .edit-btn:hover {
    background: #2980b9;
  }

  .delete-btn {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
  }

  .delete-btn:hover {
    background: #c0392b;
  }

  .delete-btn:disabled {
    background: #95a5a6;
    cursor: not-allowed;
  }

  .customer-name {
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0;
  }

  .contact-number {
    font-size: 0.9rem;
    opacity: 0.9;
    background: rgba(255,255,255,0.2);
    padding: 0.2rem 0.5rem;
    border-radius: 20px;
  }

  .card-body {
    padding: 1.5rem;
  }

  .measurements-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.8rem;
  }

  .measurement-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
  }

  .measurement-part {
    font-weight: 500;
    color: #555;
  }

  .measurement-value {
    font-weight: 600;
    color: #2d3436;
  }

  .no-measurements {
    color: #7f8c8d;
    text-align: center;
    margin: 0;
    padding: 1rem 0;
  }

  .card-footer {
    padding: 0 1.5rem 1.5rem;
  }

  .meta-info {
    font-size: 0.8rem;
    color: #7f8c8d;
  }

  .created-at {
    display: block;
    margin-bottom: 0.5rem;
  }

  .customer-notes {
    background: #f8f9fa;
    padding: 0.8rem;
    border-radius: 6px;
    margin: 0;
    font-size: 0.9rem;
    color: #555;
  }

  @media (max-width: 768px) {
    .cards-container {
      grid-template-columns: 1fr;
      padding: 1rem;
    }
    
    .action-buttons {
      flex-direction: column;
      gap: 5px;
    }
  }
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);