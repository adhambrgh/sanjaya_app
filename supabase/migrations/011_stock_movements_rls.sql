-- Enable RLS untuk stock_movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Policy: admin bisa baca semua stock_movements
DROP POLICY IF EXISTS "stock_movements_admin_read" ON public.stock_movements;
CREATE POLICY "stock_movements_admin_read" ON public.stock_movements
  FOR SELECT USING (public.is_admin());

-- Grant SELECT ke authenticated users
GRANT SELECT ON public.stock_movements TO authenticated;
