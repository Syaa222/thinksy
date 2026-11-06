const { Client } = require('pg');
const client = new Client({
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.mtpnbviztquitgszrfel',
  password: 'programermudaindonesia',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected to DB.');

  const sql = `
CREATE OR REPLACE FUNCTION public.check_user_account_status(p_email TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_has_auth BOOLEAN := false;
  v_has_profil BOOLEAN := false;
  v_nama TEXT := null;
  v_peran TEXT := null;
  v_foto TEXT := null;
  v_normalized_email TEXT;
BEGIN
  v_normalized_email := LOWER(TRIM(p_email));
  
  -- Cari user di auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE LOWER(email) = v_normalized_email
  LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    v_has_auth := true;
    
    -- Cek apakah sudah punya profil
    SELECT nama_lengkap, peran::text, foto_url
    INTO v_nama, v_peran, v_foto
    FROM public.profil
    WHERE id = v_user_id;
    
    IF v_nama IS NOT NULL THEN
      v_has_profil := true;
    END IF;
  END IF;
  
  RETURN json_build_object(
    'exists', v_has_auth,
    'has_profile', v_has_profil,
    'user_id', v_user_id,
    'nama_lengkap', v_nama,
    'peran', v_peran,
    'foto_url', v_foto
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_user_account_status(TEXT) TO anon, authenticated, service_role;
  `;

  await client.query(sql);
  console.log('Function check_user_account_status created successfully.');

  // Test calling it
  const testRes = await client.query("SELECT public.check_user_account_status('siswa@sekolah.sch.id') as res;");
  console.log('Test with existing user (siswa@sekolah.sch.id):', testRes.rows[0].res);

  const testNonExist = await client.query("SELECT public.check_user_account_status('akunbelumada999@test.com') as res;");
  console.log('Test with non-existing user:', testNonExist.rows[0].res);

  await client.end();
}

run().catch(console.error);

