# Sipariş Durumları

KarVeGo uygulamasında siparişler aşağıdaki durumlar arasında geçiş yapar:

```
Yeni > Hazırlandı > Yazdırıldı > Kargoda > Tamamlandı
```

Ayrıca, herhangi bir aşamada sipariş "Sorunlu" durumuna geçebilir.

## Durum Tanımları

| Durum         | Kod           | Açıklama                                           |
|---------------|---------------|-----------------------------------------------------|
| Yeni          | NEW           | Yeni oluşturulan veya içe aktarılan sipariş         |
| Hazırlandı    | READY         | Sipariş hazırlandı, barkod basılmaya hazır           |
| Yazdırıldı    | PRINTED       | Barkod yazdırıldı, kargoya verilmeye hazır          |
| Kargoda       | SHIPPED       | Sipariş kargoya verildi, taşıma sürecinde            |
| Sorunlu       | PROBLEMATIC   | Siparişte bir sorun var (iade, kayıp, hasar vb.)     |
| Tamamlandı    | COMPLETED     | Sipariş müşteriye başarıyla teslim edildi            |

## Geçiş Kuralları

Siparişler genellikle şu akışı izler:

1. Sipariş oluşturulduğunda **NEW** durumundadır
2. Sipariş hazırlandığında **READY** durumuna geçer
3. Barkod yazdırıldığında **PRINTED** durumuna geçer
4. Kargoya verildiğinde **SHIPPED** durumuna geçer
5. Müşteriye teslim edildiğinde **COMPLETED** durumuna geçer

Herhangi bir aşamada sorun çıkarsa sipariş **PROBLEMATIC** durumuna geçebilir.

## Migration Bilgisi

Eğer eski sisteminizden geçiyorsanız, durum eşleştirmesi aşağıdaki gibidir:

| Eski Durum           | Yeni Durum     |
|----------------------|----------------|
| BARCODE              | NEW            |
| BARCODE_PRINTED      | PRINTED        |
| IN_TRANSIT           | SHIPPED        |
| RETURN               | PROBLEMATIC    |
| DELIVERED            | COMPLETED      |

Migration için `supabase/migrations/order_status_migration.sql` dosyasını kullanabilirsiniz. 