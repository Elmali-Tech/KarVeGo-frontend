# Google Cloud'a giriş yapın
gcloud auth login

# Proje ID'nizi ayarlayın
gcloud config set project karvego

# Docker imajını oluşturun
docker build -t gcr.io/karvego/karvego .

# Oluşturulan imajı Container Registry'ye gönderin
docker push gcr.io/karvego/karvego

# Cloud Run'a deploy edin
gcloud run deploy karvego --image gcr.io/karvego/karvego --platform managed --region europe-west1 --allow-unauthenticated --min-instances=0 --max-instances=10 --set-env-vars="VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kaW1mZ2Zzb3JocnJ2a2ZkZGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMTQ1MzgsImV4cCI6MjA1ODU5MDUzOH0.eOfCYCEwmOR767pYjvsL1YHvFiP4VcLywOLgeqNCXUY,VITE_SUPABASE_URL=https://odimfgfsorhrrvkfddjd.supabase.co,VITE_SHOPIFY_CLIENT_ID=2af45d05943474c4b960cf9a654f8613,VITE_SURAT_API_URL=https://api.suratkargo.com.tr/v1,VITE_SURAT_API_KEY=your_api_key_here,VITE_SURAT_CUSTOMER_NUMBER=your_customer_number_here,VITE_SURAT_BRANCH_CODE=your_branch_code_here"

# NOT: Eğer IAM politika hatası alırsanız aşağıdaki komutu çalıştırın
# gcloud beta run services add-iam-policy-binding --region=europe-west1 --member=allUsers --role=roles/run.invoker karvego 