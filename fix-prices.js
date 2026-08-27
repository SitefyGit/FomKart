const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPrices() {
  console.log("Fetching products...");
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, base_price');

  if (prodErr) {
    console.error("Error fetching products:", prodErr);
    return;
  }

  console.log(`Found ${products.length} products. Fetching packages...`);
  
  const { data: packages, error: packErr } = await supabase
    .from('product_packages')
    .select('id, product_id, price');

  if (packErr) {
    console.error("Error fetching packages:", packErr);
    return;
  }
  
  let updatedCount = 0;

  for (const pkg of packages) {
    const product = products.find(p => p.id === pkg.product_id);
    if (product) {
      if (Number(pkg.price) !== Number(product.base_price)) {
        console.log(`Mismatch found for product ${product.id} (Package ${pkg.id}): Package price = ${pkg.price}, Product base_price = ${product.base_price}`);
        console.log(`Updating package ${pkg.id} price to ${product.base_price}`);
        
        const { error: updateErr } = await supabase
          .from('product_packages')
          .update({ price: product.base_price })
          .eq('id', pkg.id);
          
        if (updateErr) {
          console.error(`Failed to update package ${pkg.id}:`, updateErr);
        } else {
          updatedCount++;
        }
      }
    }
  }

  console.log(`Done! Updated ${updatedCount} packages.`);
}

fixPrices();
