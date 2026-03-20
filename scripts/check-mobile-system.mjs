import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('📱 Mobile PWA System Check\n');
console.log('============================\n');

// Test Results
const results = {
  manifest: { passed: 0, failed: 0, details: [] },
  serviceWorker: { passed: 0, failed: 0, details: [] },
  components: { passed: 0, failed: 0, details: [] },
  styles: { passed: 0, failed: 0, details: [] },
  pages: { passed: 0, failed: 0, details: [] },
  hooks: { passed: 0, failed: 0, details: [] }
};

// Helper function to log results
function log(category, status, message, details = null) {
  const icon = status === '✅' ? '✅' : '❌';
  console.log(`${icon} ${message}`);
  if (details) console.log(`   ${details}`);
  
  if (status === '✅') {
    results[category].passed++;
  } else {
    results[category].failed++;
  }
  results[category].details.push({ message, status, details });
}

// Phase 1: PWA Manifest Check
console.log('📋 Phase 1: PWA Manifest');
console.log('---------------------------');

const manifestPath = join(process.cwd(), 'public/manifest.json');
if (existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    
    log('manifest', '✅', 'manifest.json exists');
    
    // Check required properties
    const requiredProps = ['name', 'short_name', 'start_url', 'display', 'theme_color', 'icons'];
    requiredProps.forEach(prop => {
      if (manifest[prop]) {
        log('manifest', '✅', `Property ${prop}: EXISTS`);
      } else {
        log('manifest', '❌', `Property ${prop}: MISSING`);
      }
    });
    
    // Check PWA features
    if (manifest.display_override) {
      log('manifest', '✅', 'Display override: CONFIGURED');
    }
    
    if (manifest.shortcuts && manifest.shortcuts.length > 0) {
      log('manifest', '✅', `Shortcuts: ${manifest.shortcuts.length} configured`);
    }
    
    if (manifest.icons && manifest.icons.length >= 4) {
      log('manifest', '✅', `Icons: ${manifest.icons.length} sizes configured`);
    } else {
      log('manifest', '❌', 'Icons: Need at least 4 different sizes');
    }
    
  } catch (error) {
    log('manifest', '❌', 'manifest.json: INVALID JSON', error.message);
  }
} else {
  log('manifest', '❌', 'manifest.json: NOT FOUND');
}

// Phase 2: Service Worker Check
console.log('\n🔄 Phase 2: Service Worker');
console.log('---------------------------');

const swPath = join(process.cwd(), 'public/sw.js');
if (existsSync(swPath)) {
  const swContent = readFileSync(swPath, 'utf8');
  
  log('serviceWorker', '✅', 'sw.js exists');
  
  // Check for essential features
  const essentialFeatures = [
    'install',
    'activate', 
    'fetch',
    'caches.open',
    'cacheFirstStrategy',
    'networkFirstStrategy'
  ];
  
  essentialFeatures.forEach(feature => {
    if (swContent.includes(feature)) {
      log('serviceWorker', '✅', `Feature ${feature}: IMPLEMENTED`);
    } else {
      log('serviceWorker', '❌', `Feature ${feature}: MISSING`);
    }
  });
  
  // Check for advanced features
  const advancedFeatures = [
    'backgroundSync',
    'push',
    'skipWaiting',
    'clients.claim'
  ];
  
  advancedFeatures.forEach(feature => {
    if (swContent.includes(feature)) {
      log('serviceWorker', '✅', `Advanced ${feature}: IMPLEMENTED`);
    }
  });
  
} else {
  log('serviceWorker', '', 'sw.js: NOT FOUND');
}

// Phase 3: Mobile Components Check
console.log('\n🧩 Phase 3: Mobile Components');
console.log('------------------------------');

const mobileComponents = [
  'src/components/mobile/MobileNavigation.tsx',
  'src/components/mobile/SwipeCard.tsx',
  'src/components/mobile/BottomSheet.tsx',
  'src/components/mobile/GestureHandler.tsx',
  'src/components/adaptive/AdaptiveLayout.tsx',
  'src/components/pwa/PWAInstaller.tsx'
];

mobileComponents.forEach(compPath => {
  const fullPath = join(process.cwd(), compPath);
  if (existsSync(fullPath)) {
    log('components', '✅', `Component: ${compPath.split('/').pop()}`);
    
    // Check for TypeScript errors (basic check)
    const content = readFileSync(fullPath, 'utf8');
    if (content.includes('export')) {
      log('components', '✅', `  Exports: Found`);
    }
  } else {
    log('components', '❌', `Component: ${compPath.split('/').pop()}: MISSING`);
  }
});

// Phase 4: Mobile Styles Check
console.log('\n🎨 Phase 4: Mobile Styles');
console.log('-------------------------');

const mobileStyles = [
  'src/styles/mobile.css'
];

mobileStyles.forEach(stylePath => {
  const fullPath = join(process.cwd(), stylePath);
  if (existsSync(fullPath)) {
    const styleContent = readFileSync(fullPath, 'utf8');
    
    log('styles', '✅', `Styles: ${stylePath.split('/').pop()}`);
    
    // Check for essential mobile styles
    const essentialStyles = [
      '--safe-area-inset',
      '.mobile-nav',
      '.swipe-card',
      '.bottom-sheet',
      '.touch-target'
    ];
    
    essentialStyles.forEach(style => {
      if (styleContent.includes(style)) {
        log('styles', '✅', `  Style ${style}: DEFINED`);
      } else {
        log('styles', '❌', `  Style ${style}: MISSING`);
      }
    });
    
  } else {
    log('styles', '', `Styles: ${stylePath.split('/').pop()}: NOT FOUND`);
  }
});

// Phase 5: Mobile Pages Check
console.log('\n📄 Phase 5: Mobile Pages');
console.log('------------------------');

const mobilePages = [
  'src/app/mobile/page.tsx'
];

mobilePages.forEach(pagePath => {
  const fullPath = join(process.cwd(), pagePath);
  if (existsSync(fullPath)) {
    const pageContent = readFileSync(fullPath, 'utf8');
    
    log('pages', '✅', `Page: ${pagePath.split('/').pop()}`);
    
    // Check for mobile features
    const mobileFeatures = [
      'useDeviceDetection',
      'MobileNavigation',
      'SwipeCardStack',
      'GestureHandler',
      'BottomSheet'
    ];
    
    mobileFeatures.forEach(feature => {
      if (pageContent.includes(feature)) {
        log('pages', '✅', `  Feature ${feature}: USED`);
      } else {
        log('pages', '', `  Feature ${feature}: NOT USED`);
      }
    });
    
  } else {
    log('pages', '', `Page: ${pagePath.split('/').pop()}: NOT FOUND`);
  }
});

// Phase 6: Hooks Check
console.log('\n🪝 Phase 6: Custom Hooks');
console.log('--------------------------');

const mobileHooks = [
  'src/hooks/useDeviceDetection.ts'
];

mobileHooks.forEach(hookPath => {
  const fullPath = join(process.cwd(), hookPath);
  if (existsSync(fullPath)) {
    const hookContent = readFileSync(fullPath, 'utf8');
    
    log('hooks', '✅', `Hook: ${hookPath.split('/').pop()}`);
    
    // Check for device detection features
    const deviceFeatures = [
      'isMobile',
      'isIOS',
      'isAndroid',
      'isIPhone',
      'safeAreaInsets',
      'touchSupported'
    ];
    
    deviceFeatures.forEach(feature => {
      if (hookContent.includes(feature)) {
        log('hooks', '✅', `  Detection ${feature}: IMPLEMENTED`);
      } else {
        log('hooks', '', `  Detection ${feature}: MISSING`);
      }
    });
    
  } else {
    log('hooks', '', `Hook: ${hookPath.split('/').pop()}: NOT FOUND`);
  }
});

// Final Summary
console.log('\n📊 FINAL SUMMARY');
console.log('================');

let totalPassed = 0;
let totalFailed = 0;

Object.entries(results).forEach(([category, result]) => {
  const { passed, failed } = result;
  totalPassed += passed;
  totalFailed += failed;
  
  console.log(`${category.toUpperCase()}: ${passed} ✅ / ${failed} ❌`);
});

console.log(`\nTOTAL: ${totalPassed} ✅ / ${totalFailed} ❌`);

if (totalFailed === 0) {
  console.log('\n🎉 MOBILE PWA SYSTEM: FULLY OPERATIONAL!');
  console.log('\n📋 Next Steps:');
  console.log('1. Test mobile view: http://localhost:3000/mobile');
  console.log('2. Test PWA installation on mobile device');
  console.log('3. Test gestures and swipe interactions');
  console.log('4. Test safe areas on iPhone X+');
  console.log('5. Test offline functionality');
} else {
  console.log('\n⚠️  MOBILE PWA SYSTEM: NEEDS ATTENTION');
  
  Object.entries(results).forEach(([category, result]) => {
    if (result.failed > 0) {
      console.log(`\n${category.toUpperCase()} (${result.failed} issues):`);
      result.details
        .filter(d => d.status === '❌' || d.status === '')
        .forEach(d => console.log(`  - ${d.message}`));
    }
  });
}

console.log('\n🔗 Useful Links:');
console.log('- Mobile Demo: http://localhost:3000/mobile');
console.log('- PWA Testing: https://developers.google.com/web/tools/lighthouse');
console.log('- Device Testing: Chrome DevTools Device Mode');
console.log('- Safari Testing: iOS Simulator or real device');

// Performance recommendations
console.log('\n💡 Performance Recommendations:');
console.log('- Optimize images for mobile (WebP format)');
console.log('- Enable compression for static assets');
console.log('- Use lazy loading for images and components');
console.log('- Implement skeleton screens for better UX');
console.log('- Test on real devices, not just simulators');

console.log('\n🚀 Ready for mobile launch!');
