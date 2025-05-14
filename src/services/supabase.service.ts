import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
   process.env.SUPABASE_URL || 'https://tqreaxlwwlabkwlfwgsp.supabase.co',
   process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcmVheGx3d2xhYmt3bGZ3Z3NwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODQ5ODI4MywiZXhwIjoyMDU0MDc0MjgzfQ.FAuW0krebxEwrd6prmEu7ssI-rKY_It_WLFfO2nwhWw',
);

// local supabase
// const supabase = createClient(
//    process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
//    process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
// );


export default supabase;