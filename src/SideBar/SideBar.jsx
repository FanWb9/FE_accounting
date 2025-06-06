import React, { useState, createContext, useContext, useEffect } from "react";
import {
  Menu,
  LayoutDashboard,
  Wallet,
  ShoppingBag,
  ShoppingCart,
  Package,
  Factory,
  Briefcase,
  BarChart2,
  Settings,
  Notebook,
  Crown,
  Lock,
  Loader,
  Database,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

// Configuration
const API_URL = "http://localhost:8080";

// Permission Context
const PermissionContext = createContext();

const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return context;
};

// API Service
const subscriptionAPI = {
  getCurrentSubscription: async () => {
    try {
      const token = sessionStorage.getItem('token') || 'demo-token';
      
      const response = await fetch(`${API_URL}/api/subscription/current`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.data || result;
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return {
        id: 1,
        company_id: 1,
        plan_id: 1,
        status: "active",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        plan: {
          id: 1,
          name: "free",
          display_name: "Free Plan",
          price: 0,
          features: {
            dashboard: true,
            kas_bank: true,
            buku_besar: true
          }
        }
      };
    }
  },

  getPlans: async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscription/plans`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.data || data;
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      return [
        {
          id: 1,
          name: "free",
          display_name: "Free Plan",
          price: 0,
          features: {
            dashboard: true,
            kas_bank: true,
            buku_besar: true
          }
        },
        {
          id: 2,
          name: "standard",
          display_name: "Standard Plan",
          price: 289000,
          features: {
            dashboard: true,
            kas_bank: true,
            buku_besar: true,
            penjualan: true,
            pembelian: true,
            laporan: true
          }
        },
        {
          id: 3,
          name: "premium",
          display_name: "Premium Plan",
          price: 450000,
          features: {
            dashboard: true,
            kas_bank: true,
            buku_besar: true,
            penjualan: true,
            pembelian: true,
            produk: true,
            laporan: true
          }
        },
        {
          id: 4,
          name: "enterprise",
          display_name: "Enterprise Plan",
          price: 999000,
          features: {
            dashboard: true,
            kas_bank: true,
            buku_besar: true,
            penjualan: true,
            pembelian: true,
            produk: true,
            produksi: true,
            aset: true,
            laporan: true,
            setting: true,
            master : true
          }
        }
      ];
    }
  },

  checkPaymentStatus: async (orderId) => {
    try {
      const token = sessionStorage.getItem('token') || 'demo-token';
      
      const response = await fetch(`${API_URL}/api/subscription/payment-status/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        return result;
      }
      return null;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return null;
    }
  }
};

// Permission Provider Component
const PermissionProvider = ({ children }) => {
  const [isExpired, setIsExpired] = useState(false);
  const [userTier, setUserTier] = useState("free");
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const featureMap = {
    "Dashboard": "dashboard",
    "Kas & Bank": "kas_bank", 
    "Buku Besar": "buku_besar",
    "Penjualan": "penjualan",
    "Pembelian": "pembelian", 
    "Produk": "produk",
    "Produksi": "produksi",
    "Aset": "aset",
    "Laporan": "laporan",
    "Setting": "setting",
    "Master":"master",
  };

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      setLoading(true);
      
      try {
        const [currentSub, availablePlans] = await Promise.all([
          subscriptionAPI.getCurrentSubscription(),
          subscriptionAPI.getPlans()
        ]);
        
        if (currentSub) {
          setSubscription(currentSub);
          const planName = currentSub.plan?.name || "free";
          setUserTier(planName);
          
          // Check if subscription is expired
          if (currentSub.end_date) {
            const endDate = new Date(currentSub.end_date);
            const now = new Date();
            setIsExpired(now > endDate);
          }
        }
        
        setPlans(availablePlans);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, []);

  const hasPermission = (feature) => {
    // If subscription is expired, only allow free features
    if (isExpired) {
    return false; // Kunci semua fitur
  }

    if (!subscription || !subscription.plan) {
      const freeFeatures = ["Dashboard", "Kas & Bank", "Buku Besar"];
      return freeFeatures.includes(feature);
    }
    
    const backendFeatureName = featureMap[feature];
    
    if (subscription.plan.features && backendFeatureName) {
      return subscription.plan.features[backendFeatureName] === true;
    }

    const featurePermissions = {
      "Dashboard": ["free", "standard", "premium", "enterprise"],
      "Kas & Bank": ["free", "standard", "premium", "enterprise"],
      "Buku Besar": ["free", "standard", "premium", "enterprise"],
      "Penjualan": ["standard", "premium", "enterprise"],
      "Pembelian": ["standard", "premium", "enterprise"],
      "Produk": ["premium", "enterprise"],
      "Produksi": ["enterprise"],
      "Aset": ["premium", "enterprise"],
      "Laporan": ["standard", "premium", "enterprise"],
      "Setting": ["enterprise"],
      "Master": ["enterprise"],
    };

    const allowedTiers = featurePermissions[feature];
    return allowedTiers && allowedTiers.includes(userTier);
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case "free": return "text-green-400";
      case "standard": return "text-blue-400";
      case "premium": return "text-yellow-400";
      case "enterprise": return "text-purple-400";
      default: return "text-gray-400";
    }
  };

  const getTierName = (tier) => {
    switch (tier) {
      case "free": return "Free";
      case "standard": return "Standard";
      case "premium": return "Premium";
      case "enterprise": return "Enterprise";
      default: return "Free";
    }
  };

  const getRequiredTier = (feature) => {
    const featurePermissions = {
      "Dashboard": ["free", "standard", "premium", "enterprise"],
      "Kas & Bank": ["free", "standard", "premium", "enterprise"],
      "Buku Besar": ["free", "standard", "premium", "enterprise"],
      "Penjualan": ["standard", "premium", "enterprise"],
      "Pembelian": ["standard", "premium", "enterprise"],
      "Produk": ["premium", "enterprise"],
      "Produksi": ["enterprise"],
      "Aset": ["premium", "enterprise"],
      "Laporan": ["standard", "premium", "enterprise"],
      "Setting": ["enterprise"],
      "Master": ["enterprise"],
    };

    const allowedTiers = featurePermissions[feature];
    if (!allowedTiers || allowedTiers.length === 0) return "enterprise";
    
    if (allowedTiers.includes("free")) return "free";
    if (allowedTiers.includes("standard")) return "standard";
    if (allowedTiers.includes("premium")) return "premium";
    return "enterprise";
  };

  const pollPaymentStatus = async (orderId, maxAttempts = 1) => {
    console.log(`Starting payment status polling for order: ${orderId}`);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const status = await subscriptionAPI.checkPaymentStatus(orderId);
        console.log(`Payment status check attempt ${attempt + 1}:`, status);
        
        if (status && status.status === 'paid') {
          console.log('Payment confirmed as paid, refreshing subscription...');
          await refreshSubscription();
          return true;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Payment status check attempt ${attempt + 1} failed:`, error);
      }
    }
    
    console.log('Payment status polling completed without confirmation');
    return false;
  };

  const upgradeSubscription = async (newPlanId) => {
    try {
      const token = sessionStorage.getItem('token') || 'demo-token';
      
      if (!newPlanId || typeof newPlanId !== 'number') {
        throw new Error('Invalid plan ID provided');
      }
      
      const requestBody = {
        new_plan_id: parseInt(newPlanId),
      };
      
      console.log('Sending upgrade request:', requestBody);
      
      const response = await fetch(`${API_URL}/api/subscription/upgrade`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.token && data.order_id) {
          return new Promise(async (resolve, reject) => {
            try {
              await loadMidtransScript();
              
              console.log('Opening Midtrans popup with token:', data.token);
              
              window.snap.pay(data.token, {
                onSuccess: async function(result) {
                  console.log('Payment success callback received:', result);
                  
                  const confirmed = await pollPaymentStatus(data.order_id);
                  
                  if (confirmed) {
                    resolve({ 
                      success: true, 
                      result,
                      message: 'Pembayaran berhasil dan subscription telah diupgrade!' 
                    });
                  } else {
                    await refreshSubscription();
                    resolve({ 
                      success: true, 
                      result,
                      message: 'Pembayaran berhasil! Mohon refresh halaman jika subscription belum terupdate.' 
                    });
                  }
                },
                onPending: function(result) {
                  console.log('Payment pending:', result);
                  resolve({ 
                    pending: true, 
                    result,
                    message: 'Pembayaran dalam proses. Status akan diupdate otomatis.' 
                  });
                },
                onError: function(result) {
                  console.log('Payment error:', result);
                  reject(new Error('Pembayaran gagal. Silakan coba lagi.'));
                },
                onClose: function() {
                  console.log('Payment popup closed by user');
                  reject(new Error('Payment cancelled'));
                }
              });
            } catch (error) {
              console.error('Error loading Midtrans:', error);
              reject(error);
            }
          });
        } 
        else if (data.payment_url) {
          console.log('Opening payment URL:', data.payment_url);
          window.open(data.payment_url, '_blank');
          return { success: true, message: 'Redirected to payment page' };
        } 
        else {
          console.log('Free upgrade completed');
          await refreshSubscription();
          return { success: true, message: 'Subscription upgraded successfully' };
        }
      } else {
        const errorData = await response.json();
        console.error('Upgrade API Error:', response.status, errorData);
        throw new Error(errorData.error || `Failed to upgrade subscription: ${response.status}`);
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    }
  };

  const loadMidtransScript = () => {
    return new Promise((resolve, reject) => {
      if (window.snap) {
        resolve(window.snap);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', 'SB-Mid-client-7SLGtrfRulE5L_76');
      script.onload = () => {
        console.log('Midtrans Snap script loaded successfully');
        resolve(window.snap);
      };
      script.onerror = () => {
        console.error('Failed to load Midtrans Snap script');
        reject(new Error('Failed to load Midtrans Snap'));
      };
      document.head.appendChild(script);
    });
  };

  const refreshSubscription = async () => {
    try {
      console.log('Refreshing subscription data...');
      const updatedSub = await subscriptionAPI.getCurrentSubscription();
      if (updatedSub) {
        setSubscription(updatedSub);
        setUserTier(updatedSub.plan?.name || "free");
        
        // Update expired status
        if (updatedSub.end_date) {
          const endDate = new Date(updatedSub.end_date);
          const now = new Date();
          setIsExpired(now > endDate);
        }
        
        console.log('Subscription refreshed:', updatedSub);
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    }
  };

  return (
    <PermissionContext.Provider value={{
      userTier,
      subscription,
      plans,
      loading,
      hasPermission,
      getTierColor,
      getTierName,
      getRequiredTier,
      upgradeSubscription,
      refreshSubscription,
      isExpired,
    }}>
      {children}
    </PermissionContext.Provider>
  ); 
}; 

// Updated UpgradeModal Component 
const UpgradeModal = ({ isOpen, onClose, requiredTier, feature }) => {
  const { plans, upgradeSubscription, userTier, isExpired } = usePermissions();
  const [upgrading, setUpgrading] = useState(false);

  if (!isOpen) return null;

  const currentPlanOrder = { "free": 0, "standard": 1, "premium": 2, "enterprise": 3 };
  const requiredPlanOrder = currentPlanOrder[requiredTier] || 0;
  const currentOrder = currentPlanOrder[userTier] || 0;

  //  Jika expired, tampilkan semua paket berbayar yang memenuhi requirement
  // Jika belum expired, tampilkan upgrade dari paket saat ini
  const availableUpgrades = plans.filter(plan => {
    const planOrder = currentPlanOrder[plan.name] || 0;
    
    if (isExpired) {
    // Jika expired, tampilkan semua paket berbayar (exclude free plan)
    // karena user harus pilih paket berbayar untuk melanjutkan
    return plan.name !== "free" && planOrder >= requiredPlanOrder;
  } else {
    // Jika tidak expired, hanya tampilkan upgrade (paket lebih tinggi)
    return plan.name !== "free" && planOrder > currentOrder && planOrder >= requiredPlanOrder;
  }
});

  const handleUpgrade = async (planId) => {
    setUpgrading(true);
    try {
      console.log(`Attempting to upgrade to plan ID: ${planId}`);
      const result = await upgradeSubscription(planId);
      
      if (result.success) {
        alert(result.message || 'Pembayaran berhasil! Subscription Anda telah diupgrade.');
        onClose();
      } else if (result.pending) {
        alert(result.message || 'Pembayaran dalam proses. Mohon tunggu konfirmasi.');
        onClose();
      }
    } catch (error) {
      if (error.message === 'Payment cancelled') {
        console.log('User cancelled payment');
      } else {
        console.error('Upgrade error:', error);
        alert(`Gagal melakukan upgrade: ${error.message}`);
      }
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center mb-4">
          <Crown className="text-yellow-500 mr-2" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">
            {isExpired ? "Subscription Expired" : "Upgrade Diperlukan"}
          </h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          {isExpired ? (
            <>
              Subscription Anda telah berakhir. Untuk mengakses fitur <strong>{feature}</strong>, 
              silakan pilih paket yang sesuai untuk melanjutkan.
            </>
          ) : (
            <>
              Fitur <strong>{feature}</strong> memerlukan paket <strong>{requiredTier}</strong> atau lebih tinggi.
            </>
          )}
        </p>
        
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <p className="text-sm text-blue-800">
            <strong>Paket Anda Saat Ini:</strong> {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
            {isExpired && <span className="text-red-600 ml-2">(Expired)</span>}
          </p>
        </div>
        
        <div className="space-y-3 mb-4">
          {availableUpgrades.map((plan) => (
            <div key={plan.id} className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-800">
                  {plan.display_name}
                </h4>
                <span className="text-lg font-bold text-blue-600">
                  {plan.price === 0 ? "Gratis" : `Rp ${plan.price.toLocaleString('id-ID')}/bulan`}
                </span>
              </div>
              
              {plan.features && typeof plan.features === 'object' && (
                <div className="text-sm text-gray-600 mb-3 grid grid-cols-2 gap-1">
                  {Object.entries(plan.features)
                    .filter(([key, value]) => value === true)
                    .map(([key, value], idx) => (
                    <div key={idx} className="flex items-center">
                      <span className="text-green-500 mr-1">✓</span>
                      <span className="text-xs">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={upgrading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center font-medium"
              >
                {upgrading ? (
                  <>
                    <Loader size={16} className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  plan.price === 0 ? `Pilih ${plan.display_name}` : `Bayar Sekarang - ${plan.display_name}`
                )}
              </button>
            </div>
          ))}
        </div>
        
        {availableUpgrades.length === 0 && (
          <div className="text-center text-gray-500 mb-4">
            <p>Tidak ada paket yang tersedia untuk fitur ini.</p>
          </div>
        )}
        
        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Batal
        </button>
      </div>
    </div>
  );
};

// Menu Item Component
const MenuItem = ({ menu, index, open }) => {
  const { hasPermission, getRequiredTier } = usePermissions();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const canAccess = hasPermission(menu.name);
  const requiredTier = getRequiredTier(menu.name);
  const isActive = currentPath === menu.link;
  
  const handleClick = (e) => {
    if (!canAccess) {
      e.preventDefault();
      setShowUpgradeModal(true);
    } else {
      navigate(menu.link);
    }
  };

  const MenuContent = () => (
    <>
      <div className="flex items-center relative">
        {React.createElement(menu.icon, { size: 20 })}
        {!canAccess && (
          <Lock size={12} className="absolute -top-1 -right-1 text-red-400" />
        )}
      </div>
      
      <h2
        style={{ transitionDelay: `${index + 3}00ms` }}
        className={`whitespace-pre duration-500 ${
          !open && "opacity-0 translate-x-28 overflow-hidden"
        }`}
      >
        {menu.name}
        {!canAccess && open && (
          <span className="ml-2 text-xs bg-yellow-600 px-2 py-1 rounded">
            {requiredTier}
          </span>
        )}
      </h2>
      
      <h2
        className={`${
          open && "hidden"
        } absolute left-48 bg-white font-semibold whitespace-pre text-gray-900 rounded-md drop-shadow-lg px-0 py-0 w-0 overflow-hidden group-hover:px-2 group-hover:py-1 group-hover:left-14 group-hover:duration-300 group-hover:w-fit`}
      >
        {menu.name}
        {!canAccess && (
          <span className="ml-1 text-xs text-red-600">🔒</span>
        )}
      </h2>
    </>
  );

  return (
    <>
      <div
        onClick={handleClick}
        className={`${
          menu.margin && "mt-5"
        } group flex items-center text-sm gap-3.5 font-medium p-2 rounded-md cursor-pointer ${
          isActive 
            ? "bg-sky-500 text-white" 
            : canAccess
            ? "hover:bg-sky-400 text-gray-100"
            : "text-gray-400 hover:bg-gray-700"
        }`}
      >
        <MenuContent />
      </div>
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        requiredTier={requiredTier}
        feature={menu.name}
      />
    </>
  );
};

// Main Sidebar Component
function SideBarComponent() {
  const [open, setOpen] = useState(false);
  const { getTierColor, getTierName, userTier, subscription, loading, isExpired } = usePermissions();

  const menus = [
    { name: "Dashboard", link: "/Dashboard", icon: LayoutDashboard },
    { name: "Kas & Bank", link: "/pengeluaran", icon: Wallet },
    { name: "Buku Besar", link: "/TabelJurnal", icon: Notebook },
    { name: "Penjualan", link: "/penjualan", icon: ShoppingBag, margin: true },
    { name: "Pembelian", link: "/pembelian", icon: ShoppingCart },
    { name: "Produk", link: "/produk", icon: Package },
    { name: "Produksi", link: "/produksi", icon: Factory },
    { name: "Aset", link: "/aset", icon: Briefcase, margin: true },
    { name: "Laporan", link: "/laporan", icon: BarChart2 },
    { name: "Setting", link: "/setting", icon: Settings },
    { name: "Master", link:"/master",icon:Database},
  ];

  if (loading) {
    return (
      <div className="fixed left-0 top-0 w-16 h-screen bg-blue-950 flex items-center justify-center">
        <Loader className="text-white animate-spin" size={24} />
      </div>
    );
  }

  return (
    <section className="flex">
      <div
        className={`bg-blue-950 min-h-screen fixed ${
          open ? "w-72" : "w-16"
        } duration-500 text-gray-100 px-4 z-40 flex flex-col`}
      >
        <div className="py-5 flex justify-between items-center">
          {open && (
            <div className="flex items-center gap-2">
              <Crown className={getTierColor(userTier)} size={20} />
              <div className="flex flex-col">
                <span className={`text-sm font-medium ${getTierColor(userTier)}`}>
                  {getTierName(userTier)}
                </span>
                {subscription && subscription.end_date && (
                  <span className={`text-xs ${isExpired ? 'text-red-400' : 'text-white'}`}>
                    {isExpired ? 'Expired: ' : 'Expires: '}
                    {new Date(subscription.end_date).toLocaleDateString('id-ID')}
                  </span>
                )}
              </div>
            </div>
          )}
          <Menu
            size={26}
            className="cursor-pointer"
            onClick={() => setOpen(!open)}
          />
        </div>
        
        <div className="mt-4 flex flex-col gap-4 relative flex-1">
          {menus.map((menu, i) => (
            <MenuItem
              key={i}
              menu={menu}
              index={i}
              open={open}
            />
          ))}
        </div>
        
        {(userTier !== "enterprise" || isExpired) && open && (
          <div className="mb-4">
            <div className={`${isExpired ? 'bg-gradient-to-r from-red-600 to-orange-600' : 'bg-gradient-to-r from-yellow-600 to-orange-600'} p-3 rounded-lg text-center`}>
              <Crown size={20} className="mx-auto mb-2 text-yellow-200" />
              <p className="text-xs text-white mb-2">
                {isExpired ? 
                  "Subscription expired! Pilih paket untuk melanjutkan" :
                  `Buka semua fitur dengan ${
                    userTier === "free" ? "Standard" :
                    userTier === "standard" ? "Premium" : 
                    "Enterprise"
                  }`
                }
              </p>
              <button
                onClick={() => console.log("Redirect to upgrade page")}
                className="w-full bg-white text-orange-600 py-1 px-2 rounded text-xs font-medium hover:bg-gray-100"
              >
                {isExpired ? "Pilih Paket" : "Upgrade Sekarang"}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className={`${open ? "w-72" : "w-16"} flex-shrink-0 duration-500`}></div>
    </section>
  );
}

// Main App Component
export default function SideBar() {
  return (
    <PermissionProvider>
      <SideBarComponent />
    </PermissionProvider>
  );
}