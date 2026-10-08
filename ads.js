/**
 * Google AdSense Integration for Meds Reminder
 * 
 * This file handles ad placement and revenue tracking.
 * All features remain free for users.
 */

const ADS_CONFIG = {
    // Replace with your AdSense Publisher ID
    PUBLISHER_ID: 'ca-pub-xxxxxxxxxxxxxxxx',
    ENABLED: true,
    AD_FREQUENCY: {
        banner: 'always', // Always show banner
        interstitial: 'every_10_actions', // Every 10 user actions
        rewarded: 'optional' // Users choose to watch for perks
    },
    PLACEMENTS: {
        BOTTOM_BANNER: 'banner_bottom',
        INTERSTITIAL: 'interstitial_main',
        REWARDED: 'rewarded_main'
    }
};

let actionCounter = 0;
let canShowInterstitial = true;

/**
 * Initialize Google AdSense
 */
function initializeAds() {
    if (!ADS_CONFIG.ENABLED) return;

    // Load Google AdSense script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADS_CONFIG.PUBLISHER_ID;
    document.head.appendChild(script);

    // Create ad containers
    createAdContainers();
    
    console.log('Google AdSense initialized');
}

/**
 * Create ad container elements
 */
function createAdContainers() {
    // Banner ad at bottom
    const bannerContainer = document.createElement('div');
    bannerContainer.id = 'ad-banner';
    bannerContainer.className = 'ad-container ad-banner';
    bannerContainer.innerHTML = `
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="${ADS_CONFIG.PUBLISHER_ID}"
             data-ad-slot="1234567890"
             data-ad-format="horizontal">
        </ins>
    `;
    document.body.appendChild(bannerContainer);

    // Push ad service
    if (window.adsbygoogle) {
        window.adsbygoogle.push({});
    }
}

/**
 * Show interstitial ad (between actions)
 */
function showInterstitialAd() {
    if (!ADS_CONFIG.ENABLED || !canShowInterstitial) return;

    actionCounter++;
    
    // Show ad every 10 actions
    if (actionCounter % 10 === 0) {
        console.log('Showing interstitial ad...');
        canShowInterstitial = false;
        
        // In a real setup, this would load a Google Ad Manager interstitial
        // For now, we'll use a simple modal
        showAdModal();
        
        // Re-enable after 30 seconds
        setTimeout(() => {
            canShowInterstitial = true;
        }, 30000);
    }
}

/**
 * Show rewarded ad (user watches video for benefit)
 * Returns a promise that resolves when ad is completed
 */
async function showRewardedAd(rewardMessage = 'Thank you for watching!') {
    return new Promise((resolve) => {
        if (!ADS_CONFIG.ENABLED) {
            resolve(true);
            return;
        }

        console.log('Loading rewarded ad...');
        
        // Simulated rewarded ad
        showRewardedAdModal(rewardMessage, () => {
            resolve(true);
        });
    });
}

/**
 * Show a simple ad modal (interstitial)
 */
function showAdModal() {
    const modal = document.createElement('div');
    modal.className = 'ad-modal';
    modal.innerHTML = `
        <div class="ad-modal-content">
            <div class="ad-modal-header">
                <span>Advertisement</span>
                <button class="ad-modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="ad-modal-body">
                <p>Check out our health partners:</p>
                <ins class="adsbygoogle"
                     style="display:block; max-width:400px"
                     data-ad-client="${ADS_CONFIG.PUBLISHER_ID}"
                     data-ad-slot="0987654321"
                     data-ad-format="auto">
                </ins>
            </div>
            <button class="ad-modal-close-btn" onclick="this.parentElement.remove()">Close</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    if (window.adsbygoogle) {
        window.adsbygoogle.push({});
    }
}

/**
 * Show rewarded ad modal
 */
function showRewardedAdModal(message, onComplete) {
    const modal = document.createElement('div');
    modal.className = 'ad-modal rewarded';
    modal.innerHTML = `
        <div class="ad-modal-content">
            <div class="ad-modal-header">
                <span>Special Offer</span>
            </div>
            <div class="ad-modal-body" style="text-align: center;">
                <p style="font-size: 1.2rem; margin: 20px 0;">Watch a short video and unlock a feature!</p>
                <div class="video-placeholder" style="width: 100%; height: 200px; background: #f0f0f0; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                    <span style="color: #999;">Video Ad (15 seconds)</span>
                </div>
                <p style="color: #666; margin: 20px 0; font-size: 0.9rem;">Simulated ad - in production this would be a real video</p>
            </div>
            <button class="primary-button" onclick="document.querySelector('.ad-modal.rewarded').remove(); ${onComplete.toString().split('(')[0]}();" style="width: 100%; margin-top: 20px;">
                Video complete
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Track user action for ad frequency
 */
function trackAction(actionName) {
    // Every action might trigger an ad check
    showInterstitialAd();
    
    // Send to analytics
    console.log(`Action tracked: ${actionName}`);
}

/**
 * Get ad revenue estimate
 */
function getRevenueEstimate(users, cpmRate = 8) {
    const monthlyImpressions = users * 30; // Rough estimate
    const estimatedMonthlyRevenue = (monthlyImpressions / 1000) * cpmRate;
    return {
        monthlyImpressions,
        estimatedMonthlyRevenue,
        estimatedYearlyRevenue: estimatedMonthlyRevenue * 12,
        cpmRate
    };
}

// CSS Styles for ads
const adStyles = `
    .ad-container {
        padding: 10px 0;
        background: #f9f9f9;
        border-top: 1px solid #ddd;
    }

    .ad-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 100;
        max-height: 100px;
        overflow: auto;
    }

    .ad-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .ad-modal-content {
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .ad-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        font-weight: 700;
        color: #333;
    }

    .ad-modal-close {
        background: none;
        border: none;
        font-size: 28px;
        cursor: pointer;
        color: #999;
    }

    .ad-modal-close:hover {
        color: #333;
    }

    .ad-modal-body {
        margin-bottom: 20px;
    }

    .ad-modal-close-btn {
        width: 100%;
        padding: 12px;
        background: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: background 0.2s;
    }

    .ad-modal-close-btn:hover {
        background: #e0e0e0;
    }

    /* Ensure app scrolls above banner ad on mobile */
    @media (max-width: 640px) {
        .app-shell {
            padding-bottom: 120px;
        }
    }
`;

// Inject styles
const styleTag = document.createElement('style');
styleTag.textContent = adStyles;
if (document.head) document.head.appendChild(styleTag);

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeAds,
        showInterstitialAd,
        showRewardedAd,
        trackAction,
        getRevenueEstimate
    };
}
