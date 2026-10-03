const MF_ENVIO_COSTO = 6.9;
const MF_ENVIO_GRATIS_DESDE = 60;
const MF_CLAVE = 'mf_carrito';

const MF = {
  fmt: {
    precio(v) {
      return '$' + Number(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    estrellas(r) {
      let h = '';
      for (let i = 1; i <= 5; i++) {
        h += i <= Math.round(r) ? '<i class="fas fa-star"></i>' : '<i class="fas fa-star mf-star-off"></i>';
      }
      return h;
    },
    esc(s) {
      return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));
    }
  },

 Toast(tipo, texto) {
    let area = document.getElementById('mf-toast-area');
    if (!area) {
      area = document.createElement('div');
      area.id = 'mf-toast-area';
      area.className = 'mf-toast-area';
      area.setAttribute('role', 'status');
      area.setAttribute('aria-live', 'polite');
      document.body.appendChild(area);
    }
    const el = document.createElement('div');
    el.className = 'mf-toast' + (tipo === 'error' ? ' mf-toast-error' : '');
    el.innerHTML = '<i class="fas ' + (tipo === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check') + '"></i><span>' + MF.fmt.esc(texto) + '</span>';
    area.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .25s ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 250);
    }, 2600);
  },

  carrito: {
    leer() {
      try {
        const d = JSON.parse(localStorage.getItem(MF_CLAVE));
        return Array.isArray(d) ? d.filter(i => i && i.id && MF.buscar(i.id)) : [];
      } catch (e) {
        return [];
      }
    },
    guardar(items) {
      try {
        localStorage.setItem(MF_CLAVE, JSON.stringify(items));
      } catch (e) {
        MF.Toast('error', 'No se pudo guardar el carrito');
      }
      MF.carrito.refrescar();
      MF.pintarCarrito();
    },
    agregar(id, cant) {
      const p = MF.buscar(id);
      if (!p) return MF.Toast('error', 'Producto no encontrado');
      cant = cant || 1;
      const items = MF.carrito.leer();
      const fila = items.find(i => i.id === id);
      const actual = fila ? fila.cantidad : 0;
      if (actual + cant > p.stock) {
        return MF.Toast('error', 'Solo quedan ' + p.stock + ' unidades de ' + p.nombre);
      }
      if (fila) fila.cantidad += cant;
      else items.push({ id: id, cantidad: cant });
      MF.carrito.guardar(items);
      MF.Toast('ok', p.nombre + ' agregado al carrito');
    },
    cambiar(id, cant) {
      const p = MF.buscar(id);
      if (!p) return;
      cant = Math.max(1, Math.min(cant, p.stock));
      const items = MF.carrito.leer();
      const fila = items.find(i => i.id === id);
      if (fila) fila.cantidad = cant;
      MF.carrito.guardar(items);
    },
    quitar(id) {
      const items = MF.carrito.leer().filter(i => i.id !== id);
      MF.carrito.guardar(items);
    },
    vaciar() {
      MF.carrito.guardar([]);
      MF.Toast('ok', 'Carrito vaciado');
    },
    unidades() {
      return MF.carrito.leer().reduce((s, i) => s + i.cantidad, 0);
    },
    subtotal() {
      return MF.carrito.leer().reduce((s, i) => {
        const p = MF.buscar(i.id);
        return s + (p ? p.precio * i.cantidad : 0);
      }, 0);
    },
    refrescar() {
      document.querySelectorAll('[data-mf-cart-count]').forEach(el => {
        el.textContent = MF.carrito.unidades();
        el.style.display = MF.carrito.unidades() > 0 ? '' : 'none';
      });
    }
  },

  buscar(id) {
    return PRODUCTOS.find(p => p.id === id) || null;
  },

  nombreCategoria(id) {
    const c = CATEGORIAS.find(c => c.id === id);
    return c ? c.nombre : '';
  },

  tarjeta(p) {
    const estrellas = MF.fmt.estrellas(p.rating);
    const stock = p.stock > 5
      ? '<p class="mf-stock-ok mb-0">Disponible</p>'
      : '<p class="mf-stock-low mb-0">Ultimas ' + p.stock + ' unidades</p>';
    const precioViejo = p.precioAntes
      ? '<span class="mf-price-old">' + MF.fmt.precio(p.precioAntes) + '</span>' : '';
    const badge = p.badge
      ? '<span class="mf-badge' + (p.badge === 'Top' ? ' mf-badge-top' : p.badge === 'Nuevo' ? ' mf-badge-out' : '') + '">' + MF.fmt.esc(p.badge) + '</span>'
      : '';
    return '' +
      '<div class="col-12 col-md-6 col-lg-4 col-xl-3 mb-4">' +
        '<div class="mf-card">' +
          '<div class="mf-card-img">' +
            badge +
            '<a href="shop-single.html?p=' + p.id + '" aria-label="Ver ' + MF.fmt.esc(p.nombre) + '">' +
              '<img src="assets/img/' + p.imagenes[0] + '" alt="' + MF.fmt.esc(p.nombre) + '" loading="lazy" width="600" height="600">' +
            '</a>' +
            '<div class="mf-card-overlay">' +
              '<ul>' +
                '<li><a href="shop-single.html?p=' + p.id + '" title="Ver detalle" aria-label="Ver detalle"><i class="far fa-eye"></i></a></li>' +
                '<li><a href="#" data-mf-add="' + p.id + '" title="Agregar al carrito" aria-label="Agregar al carrito"><i class="fas fa-cart-plus"></i></a></li>' +
              '</ul>' +
            '</div>' +
          '</div>' +
          '<div class="mf-card-body">' +
            '<span class="mf-card-cat">' + MF.fmt.esc(MF.nombreCategoria(p.categoria)) + '</span>' +
            '<a href="shop-single.html?p=' + p.id + '" class="mf-card-title">' + MF.fmt.esc(p.nombre) + '</a>' +
            '<div class="d-flex justify-content-between align-items-center mb-2">' +
              '<span class="mf-stars" aria-hidden="true">' + estrellas + '</span>' +
              '<span class="mf-reviews">' + p.reviews + ' resenas</span>' +
            '</div>' +
            '<div class="mf-price-row">' +
              '<span class="mf-price">' + MF.fmt.precio(p.precio) + '</span>' + precioViejo +
            '</div>' +
            '<div class="mt-2">' + stock + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  },

  pintarDestracados() {
    const cont = document.getElementById('mf-destacados');
    if (!cont) return;
    const lista = PRODUCTOS.filter(p => p.destacado).slice(0, 4);
    cont.innerHTML = lista.length ? lista.map(MF.tarjeta).join('')
      : '<div class="col-12"><p class="mf-empty">No hay productos destacados.</p></div>';
  },

  pintarRelacionados(cat, idActual) {
    const cont = document.getElementById('mf-relacionados');
    if (!cont) return;
    const lista = PRODUCTOS.filter(p => p.categoria === cat && p.id !== idActual).slice(0, 4);
    cont.innerHTML = lista.length ? lista.map(MF.tarjeta).join('')
      : '<div class="col-12"><p class="mf-empty">No hay mas productos en esta categoria.</p></div>';
  },

  pintarCatalogo() {
    const grid = document.getElementById('mf-grid');
    if (!grid) return;

    const url = new URLSearchParams(location.search);
    const cat = url.get('cat') || 'todos';
    const orden = url.get('orden') || 'destacados';
    const q = (url.get('q') || '').trim().toLowerCase();

    let lista = PRODUCTOS.slice();
    if (cat !== 'todos') lista = lista.filter(p => p.categoria === cat);
    if (q) {
      lista = lista.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        MF.nombreCategoria(p.categoria).toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q)
      );
    }

    const ordenadores = {
      'precio-asc': (a, b) => a.precio - b.precio,
      'precio-desc': (a, b) => b.precio - a.precio,
      'nombre': (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
      'rating': (a, b) => b.rating - a.rating
    };
    if (ordenadores[orden]) lista.sort(ordenadores[orden]);

    if (lista.length === 0) {
      grid.innerHTML = '<div class="col-12"><div class="mf-empty">' +
        '<i class="fas fa-magnifying-glass"></i>' +
        '<p class="mb-1">No encontramos productos con ese criterio.</p>' +
        '<a href="shop.html" class="btn btn-success mt-2">Ver todo el catalogo</a>' +
        '</div></div>';
    } else {
      grid.innerHTML = lista.map(MF.tarjeta).join('');
    }

    const partes = [];
    partes.push(lista.length + (lista.length === 1 ? ' producto' : ' productos'));
    if (cat !== 'todos') partes.push('en ' + MF.nombreCategoria(cat));
    if (q) partes.push('para "' + url.get('q') + '"');

    const info = document.getElementById('mf-resultados-info');
    const infoMovil = document.getElementById('mf-resultados-info-movil');
    const texto = partes.join(' ');
    if (info) info.textContent = texto;
    if (infoMovil) infoMovil.textContent = texto;

    document.querySelectorAll('[data-mf-filtro]').forEach(a => {
      a.classList.toggle('active', a.dataset.mfFiltro === cat);
    });

    const chip = document.getElementById('mf-busqueda-activa');
    if (chip) chip.innerHTML = q ? 'Buscando: <span class="mf-chip">' + MF.fmt.esc(q) + '</span>' : '';

    const quitar = document.getElementById('mf-quitar-busqueda');
    if (quitar) quitar.style.display = q ? 'inline' : 'none';

    const sel = document.getElementById('mf-orden');
    if (sel) sel.value = orden;

    document.querySelectorAll('[data-mf-count]').forEach(el => {
      const c = el.dataset.mfCount;
      el.textContent = c === 'todos' ? PRODUCTOS.length : PRODUCTOS.filter(p => p.categoria === c).length;
    });
  },

  pintarDetalle() {
    const cont = document.getElementById('mf-detalle');
    if (!cont) return;
    const id = new URLSearchParams(location.search).get('p');
    const p = MF.buscar(id);

    if (!p) {
      cont.innerHTML = '<div class="col-12"><div class="mf-empty">' +
        '<i class="fas fa-box-open"></i>' +
        '<p class="mb-3">El producto que buscas no existe o ya no esta disponible.</p>' +
        '<a href="shop.html" class="btn btn-success">Volver al catalogo</a>' +
        '</div></div>';
      document.title = 'Producto no encontrado | Mascotas Felices';
      return;
    }

    document.title = p.nombre + ' | Mascotas Felices';

    const precioViejo = p.precioAntes
      ? '<span class="mf-price-old fs-5">' + MF.fmt.precio(p.precioAntes) + '</span>' : '';
    const ahorro = p.precioAntes
      ? '<span class="mf-badge mf-badge-top" style="position:static">Ahorras ' + MF.fmt.precio(p.precioAntes - p.precio) + '</span>' : '';

    const imgs = p.imagenes.map((src, i) =>
      '<img src="assets/img/' + src + '" alt="' + MF.fmt.esc(p.nombre) + ' vista ' + (i + 1) + '"' +
      (i === 0 ? ' class="active"' : '') + ' data-mf-thumb="' + src + '">'
    ).join('');

    const specs = p.specs.map(s => '<li>' + MF.fmt.esc(s) + '</li>').join('');

    cont.innerHTML = '' +
      '<div class="col-lg-5">' +
        '<img id="mf-galeria-principal" class="mf-gallery-main" src="assets/img/' + p.imagenes[0] + '" alt="' + MF.fmt.esc(p.nombre) + '" width="600" height="600">' +
        '<div class="mf-gallery-thumbs">' + imgs + '</div>' +
      '</div>' +
      '<div class="col-lg-7 mt-4 mt-lg-0">' +
        '<div class="card border-0" style="border-radius:14px;box-shadow:var(--mf-sombra)">' +
          '<div class="card-body p-4">' +
            '<span class="mf-card-cat">' + MF.fmt.esc(MF.nombreCategoria(p.categoria)) + '</span>' +
            '<h1 class="h2 fw-bold mt-1">' + MF.fmt.esc(p.nombre) + '</h1>' +
            '<div class="d-flex align-items-center gap-2 my-2">' +
              '<span class="mf-stars" aria-hidden="true">' + MF.fmt.estrellas(p.rating) + '</span>' +
              '<span class="mf-reviews">' + p.rating.toFixed(1) + ' | ' + p.reviews + ' resenas</span>' +
            '</div>' +
            '<div class="d-flex align-items-center gap-3 mb-3">' +
              '<span class="mf-price fs-3">' + MF.fmt.precio(p.precio) + '</span>' + precioViejo + ahorro +
            '</div>' +
            '<p class="mf-chip d-inline-block">' + MF.fmt.esc(p.etiqueta) + '</p>' +
            '<h6 class="fw-bold mt-3">Descripcion</h6>' +
            '<p class="text-muted">' + MF.fmt.esc(p.descripcion) + '</p>' +
            '<h6 class="fw-bold mt-4 mb-2">Especificaciones</h6>' +
            '<ul class="mf-spec-list">' + specs + '</ul>' +
            '<div class="d-flex align-items-center gap-3 mt-4 flex-wrap">' +
              '<span class="fw-bold">Cantidad</span>' +
              '<div class="mf-qty-box">' +
                '<button type="button" id="mf-qty-minus" aria-label="Quitar una unidad">&minus;</button>' +
                '<span id="mf-qty-value">1</span>' +
                '<button type="button" id="mf-qty-plus" aria-label="Agregar una unidad">+</button>' +
              '</div>' +
              '<span class="' + (p.stock > 5 ? 'mf-stock-ok' : 'mf-stock-low') + '" id="mf-stock"></span>' +
            '</div>' +
            '<div class="row g-2 mt-3">' +
              '<div class="col-sm-6"><button type="button" class="btn btn-success w-100 btn-lg" id="mf-comprar">Comprar ahora</button></div>' +
              '<div class="col-sm-6"><button type="button" class="btn btn-accent w-100 btn-lg" id="mf-anadir">Anadir al carrito</button></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    MF.iniciarDetalle(p);
  },

  iniciarDetalle(p) {
    let cantidad = 1;
    const val = document.getElementById('mf-qty-value');
    const stockTxt = document.getElementById('mf-stock');
    const btnMas = document.getElementById('mf-qty-plus');
    const btnMenos = document.getElementById('mf-qty-minus');

    const pintarStock = () => {
      if (stockTxt) {
        stockTxt.textContent = p.stock > 5
          ? 'Disponible (' + p.stock + ' unidades)'
          : 'Ultimas ' + p.stock + ' unidades';
      }
    };

    if (btnMas) btnMas.addEventListener('click', () => {
      if (cantidad < p.stock) { cantidad++; val.textContent = cantidad; }
      else MF.Toast('error', 'No hay mas stock disponible');
    });
    if (btnMenos) btnMenos.addEventListener('click', () => {
      if (cantidad > 1) { cantidad--; val.textContent = cantidad; }
    });
    pintarStock();

    const principal = document.getElementById('mf-galeria-principal');
    document.querySelectorAll('[data-mf-thumb]').forEach(th => {
      th.addEventListener('click', () => {
        if (principal) {
          principal.src = 'assets/img/' + th.dataset.mfThumb;
          principal.style.opacity = '0.4';
          setTimeout(() => { principal.style.opacity = '1'; }, 120);
        }
        document.querySelectorAll('[data-mf-thumb]').forEach(o => o.classList.remove('active'));
        th.classList.add('active');
      });
    });

    const anadir = document.getElementById('mf-anadir');
    if (anadir) anadir.addEventListener('click', () => MF.carrito.agregar(p.id, cantidad));

    const comprar = document.getElementById('mf-comprar');
    if (comprar) comprar.addEventListener('click', () => {
      MF.carrito.agregar(p.id, cantidad);
      setTimeout(() => { location.href = 'cart.html'; }, 450);
    });

    MF.pintarRelacionados(p.categoria, p.id);
  },

  pintarCarrito() {
    const items = MF.carrito.leer();
    const body = document.getElementById('mf-cart-body');
    const vacio = document.getElementById('mf-cart-vacio');
    const resumen = document.getElementById('mf-carrito-resumen');

    if (!body) {
      MF.carrito.refrescar();
      return;
    }

    if (items.length === 0) {
      if (vacio) vacio.style.display = '';
      if (resumen) resumen.style.display = 'none';
      body.innerHTML = '';
      const tr = document.getElementById('mf-cart-fila-vacia');
      if (tr) tr.style.display = '';
      return;
    }

    if (vacio) vacio.style.display = 'none';
    if (resumen) resumen.style.display = '';

    const trVacia = document.getElementById('mf-cart-fila-vacia');
    if (trVacia) trVacia.style.display = 'none';

    body.innerHTML = items.map(it => {
      const p = MF.buscar(it.id);
      if (!p) return '';
      return '' +
        '<tr>' +
          '<td>' +
            '<a href="shop-single.html?p=' + p.id + '"><img src="assets/img/' + p.imagenes[0] + '" alt="' + MF.fmt.esc(p.nombre) + '" width="76" height="76"></a>' +
          '</td>' +
          '<td>' +
            '<a href="shop-single.html?p=' + p.id + '" class="mf-card-title mb-1">' + MF.fmt.esc(p.nombre) + '</a>' +
            '<span class="mf-card-cat">' + MF.fmt.esc(MF.nombreCategoria(p.categoria)) + '</span>' +
          '</td>' +
          '<td class="fw-bold">' + MF.fmt.precio(p.precio) + '</td>' +
          '<td>' +
            '<div class="mf-qty-box">' +
              '<button type="button" data-mf-cant="' + p.id + '" data-mf-delta="-1" aria-label="Quitar una unidad">&minus;</button>' +
              '<span>' + it.cantidad + '</span>' +
              '<button type="button" data-mf-cant="' + p.id + '" data-mf-delta="1" aria-label="Agregar una unidad">+</button>' +
            '</div>' +
          '</td>' +
          '<td class="fw-bold text-end">' + MF.fmt.precio(p.precio * it.cantidad) + '</td>' +
          '<td class="text-end">' +
            '<button type="button" class="mf-link-danger" data-mf-quitar="' + p.id + '">' +
              '<i class="fas fa-trash me-1"></i>Quitar</button>' +
          '</td>' +
        '</tr>';
    }).join('');

    const subtotal = MF.carrito.subtotal();
    const envio = subtotal >= MF_ENVIO_GRATIS_DESDE || subtotal === 0 ? 0 : MF_ENVIO_COSTO;
    const faltan = MF_ENVIO_GRATIS_DESDE - subtotal;

    const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    set('mf-subtotal', MF.fmt.precio(subtotal));
    set('mf-envio', envio === 0 ? 'Gratis' : MF.fmt.precio(envio));
    set('mf-total', MF.fmt.precio(subtotal + envio));
    set('mf-unidades', MF.carrito.unidades() + (MF.carrito.unidades() === 1 ? ' articulo' : ' articulos'));

    const pista = document.getElementById('mf-envio-pista');
    if (pista) {
      pista.textContent = envio === 0
        ? 'Tienes envio gratis en este pedido.'
        : 'Te faltan ' + MF.fmt.precio(faltan) + ' para conseguir envio gratis.';
    }

    MF.carrito.refrescar();
  },

  iniciarBusqueda() {
    const input = document.getElementById('mf-search-input');
    const cont = document.getElementById('mf-search-results');
    if (!input || !cont) return;

    const render = () => {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) {
        cont.innerHTML = '<p class="text-muted mb-0">Escribe al menos 2 caracteres.</p>';
        return;
      }
      const lista = PRODUCTOS.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        MF.nombreCategoria(p.categoria).toLowerCase().includes(q)
      ).slice(0, 6);

      cont.innerHTML = lista.length
        ? lista.map(p =>
            '<a class="mf-sr-item" href="shop-single.html?p=' + p.id + '" data-bs-dismiss="modal">' +
              '<img src="assets/img/' + p.imagenes[0] + '" alt="" width="52" height="52" loading="lazy">' +
              '<span><span class="mf-sr-name d-block">' + MF.fmt.esc(p.nombre) + '</span>' +
              '<span class="mf-sr-price">' + MF.fmt.precio(p.precio) + '</span></span>' +
            '</a>').join('')
        : '<p class="text-muted mb-0">Sin resultados para "' + MF.fmt.esc(q) + '".</p>';
    };

    let t;
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(render, 180); });
    render();
  },

  iniciarFormulario() {
    const form = document.getElementById('mf-form-contacto');
    if (!form) return;
    const ok = document.getElementById('mf-alert-ok');

    const reglas = {
      nombre: v => v.trim().length >= 3 || 'Escribe tu nombre completo.',
      email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Escribe un email valido.',
      telefono: v => v.trim() === '' || /^[0-9+\s()-]{7,}$/.test(v.trim()) || 'Escribe un telefono valido.',
      asunto: v => v.trim().length >= 4 || 'Escribe el asunto.',
      mensaje: v => v.trim().length >= 15 || 'Cuentanos con mas detalle (minimo 15 caracteres).'
    };

    const chequear = campo => {
      const regla = reglas[campo.name];
      if (!regla) return true;
      const msg = regla(campo.value);
      const cont = campo.parentElement.querySelector('.mf-error-msg');
      if (msg === true) {
        campo.classList.remove('is-invalid');
        campo.classList.add('is-valid');
        if (cont) { cont.textContent = ''; cont.classList.remove('show'); }
        return true;
      }
      campo.classList.add('is-invalid');
      campo.classList.remove('is-valid');
      if (cont) { cont.textContent = msg; cont.classList.add('show'); }
      return false;
    };

    Object.keys(reglas).forEach(n => {
      const campo = form.querySelector('[name="' + n + '"]');
      if (!campo) return;
      campo.addEventListener('blur', () => chequear(campo));
      campo.addEventListener('input', () => {
        if (campo.classList.contains('is-invalid')) chequear(campo);
      });
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      let valido = true;
      Object.keys(reglas).forEach(n => {
        const campo = form.querySelector('[name="' + n + '"]');
        if (campo && !chequear(campo)) valido = false;
      });

      if (!valido) {
        const primero = form.querySelector('.is-invalid');
        if (primero) primero.focus();
        return MF.Toast('error', 'Revisa los campos marcados en rojo');
      }

      if (ok) {
        const campoNombre = form.querySelector('[name="nombre"]');
        const nombre = campoNombre ? campoNombre.value.trim().split(' ')[0] : '';
        ok.innerHTML = '<i class="fas fa-circle-check me-2"></i><strong>Gracias ' + MF.fmt.esc(nombre) +
          '.</strong> Recibimos tu mensaje y te respondemos dentro de las proximas 24 horas.';
        ok.classList.add('show');
        ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      form.reset();
      form.querySelectorAll('.is-valid').forEach(c => c.classList.remove('is-valid'));
    });
  },

  iniciarDelegacion() {
    document.addEventListener('click', e => {
      const add = e.target.closest('[data-mf-add]');
      if (add) {
        e.preventDefault();
        MF.carrito.agregar(add.dataset.mfAdd, 1);
        return;
      }
      const menos = e.target.closest('[data-mf-cant]');
      if (menos) {
        e.preventDefault();
        const id = menos.dataset.mfCant;
        const item = MF.carrito.leer().find(i => i.id === id);
        const nueva = (item ? item.cantidad : 0) + parseInt(menos.dataset.mfDelta, 10);
        if (nueva < 1) MF.carrito.quitar(id);
        else MF.carrito.cambiar(id, nueva);
        return;
      }
      const quitar = e.target.closest('[data-mf-quitar]');
      if (quitar) {
        e.preventDefault();
        MF.carrito.quitar(quitar.dataset.mfQuitar);
        return;
      }
      const vaciar = e.target.closest('[data-mf-vaciar]');
      if (vaciar) {
        e.preventDefault();
        MF.carrito.vaciar();
      }
    });
  },

  iniciarFiltros() {
    const sel = document.getElementById('mf-orden');
    const actual = new URLSearchParams(location.search);

    if (sel) {
      sel.addEventListener('change', () => {
        const p = new URLSearchParams(location.search);
        if (sel.value === 'destacados') p.delete('orden');
        else p.set('orden', sel.value);
        location.href = 'shop.html' + (p.toString() ? '?' + p.toString() : '');
      });
    }

    document.querySelectorAll('[data-mf-filtro]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const p = new URLSearchParams(location.search);
        if (a.dataset.mfFiltro === 'todos') p.delete('cat');
        else p.set('cat', a.dataset.mfFiltro);
        location.href = 'shop.html' + (p.toString() ? '?' + p.toString() : '');
      });
    });

    const quitar = document.getElementById('mf-quitar-busqueda');
    if (quitar) {
      quitar.addEventListener('click', e => {
        e.preventDefault();
        location.href = 'shop.html';
      });
    }

    return actual;
  },

  iniciar() {
    MF.carrito.refrescar();
    MF.iniciarDelegacion();
    MF.iniciarFiltros();
    MF.pintarDestracados();
    MF.pintarCatalogo();
    MF.pintarDetalle();
    MF.pintarCarrito();
    MF.iniciarBusqueda();
    MF.iniciarFormulario();
  }
};

document.addEventListener('DOMContentLoaded', MF.iniciar);