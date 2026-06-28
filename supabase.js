/**
 * Module de connexion Supabase pour GlockCleaner
 * Charge les credentials depuis le fichier .env
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement depuis le fichier .env
const envPath = path.join(__dirname, '.env');
const envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  // Parse chaque ligne en ignorant les commentaires et lignes vides
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    // Ignorer lignes vides ou commentaires
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.substring(0, idx).trim();
      const value = trimmed.substring(idx + 1).trim();
      envVars[key] = value;
    }
  });
  console.log('[Supabase] .env loaded, keys:', Object.keys(envVars).join(', '));
}

// Configuration Supabase
const supabaseUrl = envVars.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = envVars.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('[Supabase] URL:', supabaseUrl ? 'Configurée' : 'MANQUANTE');
console.log('[Supabase] ANON_KEY:', supabaseAnonKey ? 'Configurée' : 'MANQUANTE');
console.log('[Supabase] SERVICE_KEY:', supabaseServiceKey ? 'Configurée' : 'MANQUANTE');

// Client public (anon) pour les operations utilisateur
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Client service (admin) pour les operations serveur
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = { supabase, supabaseAdmin };