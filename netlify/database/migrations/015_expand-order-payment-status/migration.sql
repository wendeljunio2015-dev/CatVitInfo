ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_status_check
CHECK (status IN (
  'novo',
  'em_atendimento',
  'concluido',
  'cancelado',
  'aguardando_pagamento',
  'pago',
  'pagamento_recusado',
  'cancelled',
  'refunded',
  'charged_back'
));
