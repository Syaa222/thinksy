const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://mtpnbviztquitgszrfel.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10cG5idml6dHF1aXRnc3pyZmVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODQ5NTMsImV4cCI6MjEwMDc2MDk1M30._ysWiY1mzCr0YRAJ85YadlktwafcL0N1PsCDzeQwSzU'
);

async function testLogin() {
  const users = [
    { email: 'siswa.demo@thinksy.app', pass: 'password123' },
    { email: 'guru.demo@thinksy.app', pass: 'password123' },
    { email: 'siswa@sekolah.sch.id', pass: 'password123' },
    { email: 'adminsekolah1@gmail.com', pass: 'password123' }
  ];

  for (const u of users) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: u.email,
      password: u.pass
    });
    console.log(u.email, '=>', error ? error.message : 'SUCCESS! UID: ' + data.user.id);
  }
}

testLogin().catch(console.error);
