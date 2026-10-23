import Link from 'next/link';
import Legal from '@/components/Legal';

export const metadata = { title: 'Aviso de privacidad | Nebajpolis' };

export default function PrivacidadPage() {
  return (
    <Legal titulo="AVISO DE PRIVACIDAD" actualizado="octubre de 2026">
      <section><h2>1. Qué datos recopilamos</h2>
        <ul>
          <li><b>Cuenta:</b> nombre, correo, teléfono (opcional) y contraseña. La contraseña se guarda cifrada; nadie, ni nosotros, puede verla.</li>
          <li><b>Compras:</b> funciones, asientos, productos, monto y fecha. Si compras como invitado, guardamos el correo (y el nombre, si lo indicas) para enviarte las entradas.</li>
          <li><b>Reseñas:</b> calificación y comentario que publiques sobre una película.</li>
          <li><b>Contacto:</b> el nombre, correo y mensaje que nos envíes por el formulario.</li>
        </ul>
      </section>
      <section><h2>2. Para qué los usamos</h2>
        <ul>
          <li>Procesar tu compra y enviarte tus entradas por correo.</li>
          <li>Permitirte consultar tu historial en “Mis boletos” y recuperar tu contraseña.</li>
          <li>Atender tus consultas y gestionar reembolsos.</li>
          <li>Generar estadísticas generales de ventas, sin identificarte.</li>
        </ul>
        <p>No vendemos tus datos ni los usamos para publicidad de terceros.</p>
      </section>
      <section><h2>3. Pagos</h2><p>Los datos de tu tarjeta los captura y procesa directamente Stripe. Nebajpolis nunca los recibe ni los almacena.</p></section>
      <section><h2>4. Con quién los compartimos</h2><p>Solo con los proveedores necesarios para operar: Stripe (pagos) y Brevo (envío de correos). Estos proveedores tratan los datos según sus propias políticas.</p></section>
      <section><h2>5. Conservación y seguridad</h2><p>Conservamos tus datos mientras tengas una cuenta o mientras sean necesarios para atender compras y reembolsos. Usamos conexiones cifradas (HTTPS), contraseñas cifradas y acceso restringido a la información.</p></section>
      <section><h2>6. Tus derechos</h2><p>Puedes consultar y actualizar tus datos en <Link href="/perfil">tu perfil</Link>. Para solicitar la eliminación de tu cuenta o de los datos de una compra como invitado, escríbenos desde <Link href="/contacto">Contacto</Link>.</p></section>
      <section><h2>7. Cambios a este aviso</h2><p>Podemos actualizar este aviso. La versión vigente es la publicada en esta página. Consulta también los <Link href="/terminos">Términos y condiciones</Link>.</p></section>
    </Legal>
  );
}
