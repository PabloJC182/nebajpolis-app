import Link from 'next/link';
import Legal from '@/components/Legal';

export const metadata = { title: 'Términos y condiciones | Nebajpolis' };

export default function TerminosPage() {
  return (
    <Legal titulo="TÉRMINOS Y CONDICIONES" actualizado="octubre de 2026">
      <section><h2>1. Aceptación</h2><p>Al comprar boletos o productos en Nebajpolis aceptas estos términos. Si no estás de acuerdo, te pedimos no usar el servicio de venta en línea.</p></section>
      <section><h2>2. Compra de boletos</h2>
        <ul>
          <li>Puedes comprar con una cuenta o como invitado. Como invitado necesitamos un correo válido: ahí se envían tus entradas.</li>
          <li>Al elegir tus asientos, estos se reservan por <b>10 minutos</b>. Si no completas el pago en ese tiempo, la reserva vence y los asientos vuelven a estar disponibles.</li>
          <li>Los precios se muestran en quetzales (Q). El cargo en tu tarjeta puede realizarse en otra moneda según la configuración del comercio; el monto exacto se muestra antes de pagar.</li>
          <li>Cada entrada tiene un código QR único, válido para una sola función, un solo asiento y un solo ingreso.</li>
        </ul>
      </section>
      <section><h2>3. Pagos</h2><p>Los pagos con tarjeta los procesa Stripe. Nebajpolis no almacena ni tiene acceso a los datos completos de tu tarjeta.</p></section>
      <section><h2>4. Cambios, cancelaciones y reembolsos</h2>
        <ul>
          <li>Una vez pagada, la compra no se cambia ni se cancela por decisión del cliente, salvo que la función se suspenda o exista un error de nuestra parte.</li>
          <li>Si una función se cancela, se reembolsa el monto completo por el mismo medio de pago. Te avisaremos por correo.</li>
          <li>No se reembolsan entradas que ya fueron validadas en la sala.</li>
          <li>El banco puede tardar algunos días hábiles en reflejar un reembolso.</li>
          <li>Para solicitar un reembolso, escríbenos desde <Link href="/contacto">Contacto</Link> indicando el número de tu compra.</li>
        </ul>
      </section>
      <section><h2>5. Promociones</h2><p>Cada promoción indica sus condiciones: porcentaje de descuento, vigencia y los días de la semana de la función en que aplica. Si la función elegida no cumple las condiciones, la promoción no se aplica. Las promociones no son acumulables ni canjeables por dinero.</p></section>
      <section><h2>6. Clasificación y acceso a las salas</h2><p>Cada película muestra su clasificación por edad. El personal puede solicitar identificación para verificar el cumplimiento de la clasificación. Es necesario presentar el código QR de la entrada para ingresar.</p></section>
      <section><h2>7. Dulcería</h2><p>Los productos de dulcería comprados en línea se entregan en el cine. Los precios y la disponibilidad pueden variar; el precio vigente es el mostrado al momento de la compra.</p></section>
      <section><h2>8. Uso del sitio</h2><p>Está prohibido usar el sitio para fines fraudulentos, automatizar compras masivas o intentar acceder a información de otros usuarios. Podemos cancelar compras que incumplan estas reglas.</p></section>
      <section><h2>9. Cambios a estos términos</h2><p>Podemos actualizar estos términos. La versión vigente es la publicada en esta página.</p></section>
      <section><h2>10. Contacto</h2><p>Para cualquier duda, usa la página de <Link href="/contacto">Contacto</Link>. Consulta también nuestro <Link href="/privacidad">Aviso de privacidad</Link>.</p></section>
    </Legal>
  );
}
