import { PlatformAdapter } from './types';
import { WordPressAdapter } from './wordpress';
import { ShopifyAdapter } from './shopify';
import { WixAdapter } from './wix';

export function getPlatformAdapter(platform: string): PlatformAdapter | null {
    switch (platform.toLowerCase()) {
        case 'wordpress':
            return new WordPressAdapter();
        case 'shopify':
            return new ShopifyAdapter();
        case 'wix':
            return new WixAdapter();
        default:
            return null;
    }
}

export * from './types';
