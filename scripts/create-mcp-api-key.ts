import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import connection from '../database/database';
import ApiKey from '../database/models/apiKey';
import User from '../database/models/user';
import { encrypt } from '../utils/encryption';

async function createMCPApiKey() {
    try {
        // Initialize database
        await connection.sync();

        // Get the first user (or specify user ID)
        const user = await User.findOne();

        if (!user) {
            console.error('No user found in database. Please create a user first.');
            process.exit(1);
        }

        const userId = user.id || (user as any).ID;
        console.log(`Creating API key for user: ${user.email} (ID: ${userId})`);

        // Use the existing API key or generate new one
        const apiKey = 'sk_live_65fe03dc5bdc9afdab6df0af3884c92563d94526b547b3eeffc9aac5df73272b';

        // Hash the key for validation
        const keyHash = await bcrypt.hash(apiKey, 10);

        // Encrypt the key for storage
        const keyEncrypted = encrypt(apiKey);

        // Full permissions for MCP
        const permissions = [
            'read:domains',
            'read:keywords',
            'read:posts',
            'read:gsc',
            'read:analytics',
            'write:posts',
            'write:keywords',
            'admin:all'
        ];

        // Create API key record
        const newKey = await ApiKey.create({
            user_id: userId,
            key_hash: keyHash,
            key_encrypted: keyEncrypted,
            name: 'Claude Desktop MCP',
            permissions,
            expires_at: null, // No expiration
            revoked: false
        });

        console.log('\n✅ API Key created successfully!');
        console.log('ID:', newKey.id);
        console.log('Name:', newKey.name);
        console.log('User ID:', newKey.user_id);
        console.log('Permissions:', permissions.join(', '));
        console.log('\nAPI Key:', apiKey);
        console.log('\n⚠️  Save this key - it won\'t be shown again!');

        process.exit(0);
    } catch (error) {
        console.error('Error creating API key:', error);
        process.exit(1);
    }
}

createMCPApiKey();
