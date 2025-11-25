// Environment Setup Utility
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env');
const ENV_EXAMPLE = path.join(__dirname, '..', '.env.example');

// Default environment variables
const DEFAULT_ENV = {
    PORT: '3000',
    NODE_ENV: 'development',
    JWT_SECRET: 'klinik_sentosa_secret_key_change_in_production_' + Date.now(),
    JWT_EXPIRE: '7d',
    CORS_ORIGIN: 'http://localhost:5500,http://127.0.0.1:5500'
};

/**
 * Check if .env file exists
 */
function envFileExists() {
    return fs.existsSync(ENV_FILE);
}

/**
 * Create .env file from .env.example or defaults
 */
function createEnvFile() {
    let envContent = '';
    
    // Try to read from .env.example first
    if (fs.existsSync(ENV_EXAMPLE)) {
        try {
            envContent = fs.readFileSync(ENV_EXAMPLE, 'utf8');
            console.log('✓ Created .env from .env.example');
        } catch (error) {
            console.warn('⚠ Could not read .env.example, using defaults');
            envContent = generateEnvFromDefaults();
        }
    } else {
        // Generate from defaults
        envContent = generateEnvFromDefaults();
        console.log('✓ Created .env with default values');
    }
    
    // Write .env file
    try {
        fs.writeFileSync(ENV_FILE, envContent, 'utf8');
        console.log('✓ .env file created successfully');
        return true;
    } catch (error) {
        console.error('❌ Error creating .env file:', error.message);
        return false;
    }
}

/**
 * Generate .env content from default values
 */
function generateEnvFromDefaults() {
    let content = '# Environment Variables for Klinik Sentosa Backend\n';
    content += '# Generated automatically - modify as needed\n\n';
    
    content += '# Server Configuration\n';
    content += `PORT=${DEFAULT_ENV.PORT}\n`;
    content += `NODE_ENV=${DEFAULT_ENV.NODE_ENV}\n\n`;
    
    content += '# Database Configuration\n';
    content += `# SQLite database will be created automatically at backend/klinik.db\n\n`;
    
    content += '# JWT Configuration\n';
    content += `JWT_SECRET=${DEFAULT_ENV.JWT_SECRET}\n`;
    content += `JWT_EXPIRE=${DEFAULT_ENV.JWT_EXPIRE}\n\n`;
    
    content += '# CORS Configuration\n';
    content += `CORS_ORIGIN=${DEFAULT_ENV.CORS_ORIGIN}\n`;
    
    return content;
}

/**
 * Ensure .env file exists, create if not
 */
function ensureEnvFile() {
    if (!envFileExists()) {
        console.log('\n📝 .env file not found. Creating one...\n');
        return createEnvFile();
    }
    return true;
}


module.exports = {
    ensureEnvFile,
    DEFAULT_ENV,
    envFileExists,
    createEnvFile
};

