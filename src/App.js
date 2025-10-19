import React, { useState, useEffect } from 'react';
import { Play, Code, BookOpen, Menu, X, Sun, Moon, Copy, Check, Loader, Eye, EyeOff, Lightbulb, CheckCircle2, Award, RotateCcw, Trophy } from 'lucide-react';

const executeCode = async (code) => {
  try {
    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'java',
        version: '*',
        files: [{ name: 'Main.java', content: code, encoding: 'utf8' }],
        compile_options: ['-encoding', 'UTF-8']
      })
    });
    const result = await response.json();
    return {
      output: result.run.output || result.compile?.output || 'Çıktı yok',
      error: result.run.stderr || result.compile?.stderr
    };
  } catch (error) {
    return { output: '', error: 'Hata: ' + error.message };
  }
};

const CodeEditor = ({ initialCode, readOnly = false, expectedOutput = null, onSuccess = null }) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  const normalizeText = (text) => {
    return text
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'I')
      .replace(/ğ/g, 'g')
      .replace(/Ğ/g, 'G')
      .replace(/ü/g, 'u')
      .replace(/Ü/g, 'U')
      .replace(/ş/g, 's')
      .replace(/Ş/g, 'S')
      .replace(/ö/g, 'o')
      .replace(/Ö/g, 'O')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'C')
      .replace(/['']/g, "'")  // Farklı apostrof türlerini standartlaştır
      .trim();
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('⏳ Kod çalıştırılıyor...');
    setIsCorrect(null);
    const normalizedCode = normalizeText(code);
    const result = await executeCode(normalizedCode);
    
    if (result.error) {
      setOutput('❌ Hata:\n' + result.error);
      setIsCorrect(false);
    } else {
      setOutput('✅ Çıktı:\n' + result.output);
      
      if (expectedOutput) {
        // Her iki metni de normalize ederek karşılaştır
        const normalizedOutput = normalizeText(result.output);
        const normalizedExpected = normalizeText(expectedOutput);
        const correct = normalizedOutput.includes(normalizedExpected);
        
        setIsCorrect(correct);
        if (correct && onSuccess) onSuccess();
      }
    }
    setIsRunning(false);
  };

  const handleReset = () => {
    setCode(initialCode);
    setOutput('');
    setIsCorrect(null);
  };

  return (
    <div className="code-editor">
      <div className="editor-header">
        <span><Code size={16} /> Java Kodu</span>
        <div className="actions">
          <button onClick={handleReset} className="icon-btn" title="Kodu Sıfırla">
            <RotateCcw size={16} />
          </button>
          <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="icon-btn" title="Kopyala">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          {!readOnly && (
            <button onClick={handleRun} disabled={isRunning} className="run-btn">
              {isRunning ? <Loader className="spin" size={16} /> : <Play size={16} />}
              Çalıştır
            </button>
          )}
        </div>
      </div>
      <textarea value={code} onChange={(e) => setCode(e.target.value)} readOnly={readOnly} className="code-area" spellCheck={false} />
      {output && (
        <div className="output-panel">
          <div className="output-header">
            <span>Çıktı</span>
            {isCorrect !== null && <span className={`status ${isCorrect ? 'correct' : 'incorrect'}`}>{isCorrect ? '✓ Doğru!' : '✗ Tekrar dene'}</span>}
          </div>
          <pre className="output-content">{output}</pre>
          {expectedOutput && !isCorrect && output && (
            <div className="expected-output"><strong>Beklenen çıktı:</strong><pre>{expectedOutput}</pre></div>
          )}
        </div>
      )}
    </div>
  );
};

const Exercise = ({ title, description, starterCode, solution, hints = [], difficulty, expectedOutput, exerciseId, onSolve }) => {
  const [expanded, setExpanded] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [currentHint, setCurrentHint] = useState(-1);
  const [solved, setSolved] = useState(() => {
    const saved = localStorage.getItem(`exercise-${exerciseId}`);
    return saved === 'true';
  });
  
  const colors = { '🟢': '#22c55e', '🟡': '#eab308', '🔴': '#ef4444' };

  const handleSuccess = () => {
    setSolved(true);
    localStorage.setItem(`exercise-${exerciseId}`, 'true');
    if (onSolve) onSolve();
  };

  return (
    <div className={`exercise ${solved ? 'solved' : ''}`}>
      <div className="ex-header" onClick={() => setExpanded(!expanded)}>
        <div className="ex-title">
          <span className="difficulty" style={{ color: colors[difficulty] }}>{difficulty}</span>
          <h4>{title}</h4>
          {solved && <CheckCircle2 size={20} color="#22c55e" />}
        </div>
        <button className="expand-btn">{expanded ? '−' : '+'}</button>
      </div>
      {expanded && (
        <div className="ex-content">
          <div className="ex-description">
            <p>{description}</p>
            {expectedOutput && <div className="expected-info"><strong>💡 Beklenen Çıktı:</strong><pre>{expectedOutput}</pre></div>}
          </div>
          <div className="ex-controls">
            {hints.length > 0 && (
              <button onClick={() => setCurrentHint(Math.min(currentHint + 1, hints.length - 1))} className="hint-btn" disabled={currentHint >= hints.length - 1}>
                <Lightbulb size={16} />{currentHint === -1 ? 'İpucu Al' : 'Sonraki İpucu'} ({Math.min(currentHint + 1, hints.length)}/{hints.length})
              </button>
            )}
            <button onClick={() => setShowSolution(!showSolution)} className="solution-btn">
              {showSolution ? <EyeOff size={16} /> : <Eye size={16} />}{showSolution ? 'Çözümü Gizle' : 'Çözümü Göster'}
            </button>
          </div>
          {currentHint >= 0 && (
            <div className="hints">
              {hints.slice(0, currentHint + 1).map((hint, idx) => (
                <div key={idx} className="hint"><span className="hint-number">İpucu {idx + 1}:</span><span>{hint}</span></div>
              ))}
            </div>
          )}
          <div className="code-section">
            <h5>📝 Kodunu Yaz:</h5>
            <CodeEditor initialCode={starterCode} expectedOutput={expectedOutput} onSuccess={handleSuccess} />
          </div>
          {showSolution && (
            <div className="solution-section"><h5>✅ Çözüm:</h5><CodeEditor initialCode={solution} readOnly={true} /></div>
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : true;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState(() => {
    const saved = localStorage.getItem('activeSection');
    return saved !== null ? parseInt(saved) : 0;
  });
  const [solvedCount, setSolvedCount] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('activeSection', activeSection.toString());
  }, [activeSection]);

  useEffect(() => {
    const count = sections.reduce((total, section) => {
      const sectionSolved = section.exercises?.filter(ex => 
        localStorage.getItem(`exercise-${ex.id}`) === 'true'
      ).length || 0;
      return total + sectionSolved;
    }, 0);
    setSolvedCount(count);
  }, [activeSection]);

  const sections = [
    {
      id: 'intro',
      title: '🎯 Bölüm 1: Lambda Giriş',
      content: `<h3>Lambda Nedir?</h3>
        <p>Lambda ifadeleri, anonim fonksiyonlardır. Java 8 ile birlikte gelen bu özellik, kodu daha kısa ve okunabilir hale getirir. Lambda'lar fonksiyonel programlamanın temelini oluşturur.</p>
        <h4>Temel Syntax:</h4>
        <pre>(parametreler) -> { kod bloğu }</pre>
        <h4>Örnekler:</h4>
        <pre>// Parametresiz lambda
() -> System.out.println("Merhaba")

// Tek parametreli
x -> x * 2

// Çok parametreli
(x, y) -> x + y

// Kod bloğu ile
(x, y) -> {
    int sonuc = x + y;
    return sonuc;
}</pre>
        <p><strong>Önemli:</strong> Lambda ifadeleri sadece fonksiyonel interface'ler ile kullanılabilir. Fonksiyonel interface, tek bir abstract metoda sahip interface'dir.</p>`,
      exercises: [
        {
          id: 'lambda-1',
          title: 'İki Katını Alma',
          description: 'Bir sayının iki katını hesaplayan lambda yazın. Function<Integer, Integer> kullanarak apply() metoduyla test edin.',
          difficulty: '🟢',
          starterCode: `import java.util.function.Function;

public class Main {
    public static void main(String[] args) {
        // TODO: Function<Integer, Integer> ikiKat = ...
        
        System.out.println("5'in iki katı: " + ikiKat.apply(5));
        System.out.println("10'un iki katı: " + ikiKat.apply(10));
    }
}`,
          solution: `import java.util.function.Function;

public class Main {
    public static void main(String[] args) {
        Function<Integer, Integer> ikiKat = x -> x * 2;
        
        System.out.println("5'in iki katı: " + ikiKat.apply(5));
        System.out.println("10'un iki katı: " + ikiKat.apply(10));
    }
}`,
          hints: [
            'Function<Integer, Integer> kullanın - girdi ve çıktı Integer',
            'Lambda syntax: x -> x * 2',
            'apply() metodu ile kullanın'
          ],
          expectedOutput: "5'in iki katı: 10\n10'un iki katı: 20"
        },
        {
          id: 'lambda-2',
          title: 'String Birleştirme',
          description: 'İki String parametresi alan ve bunları boşluk ile birleştiren lambda yazın. BiFunction kullanın.',
          difficulty: '🟢',
          starterCode: `import java.util.function.BiFunction;

public class Main {
    public static void main(String[] args) {
        // TODO: BiFunction<String, String, String> birlestir = ...
        
        System.out.println(birlestir.apply("Merhaba", "Dünya"));
    }
}`,
          solution: `import java.util.function.BiFunction;

public class Main {
    public static void main(String[] args) {
        BiFunction<String, String, String> birlestir = (s1, s2) -> s1 + " " + s2;
        
        System.out.println(birlestir.apply("Merhaba", "Dünya"));
    }
}`,
          hints: [
            'BiFunction üç tip parametresi alır: <T, U, R>',
            'İki String parametresi: (s1, s2)',
            's1 + " " + s2 ile birleştirin'
          ],
          expectedOutput: "Merhaba Dünya"
        }
      ]
    },
    {
      id: 'consumer',
      title: '🔧 Bölüm 2: Consumer',
      content: `<h3>Consumer - Tüketici</h3>
        <p>Consumer, veri alır, işler ama geriye hiçbir şey döndürmez (void). En yaygın kullanım alanı forEach() ile liste elemanlarını işlemektir.</p>
        <h4>Tanımı:</h4>
        <pre>@FunctionalInterface
public interface Consumer&lt;T&gt; {
    void accept(T t);
    
    default Consumer&lt;T&gt; andThen(Consumer&lt;T&gt; after) {
        // Zincirleme için
    }
}</pre>
        <h4>Kullanım Örnekleri:</h4>
        <pre>// Basit kullanım
Consumer&lt;String&gt; yazdir = s -> System.out.println(s);
yazdir.accept("test");

// Liste ile
List&lt;String&gt; liste = Arrays.asList("a", "b", "c");
liste.forEach(s -> System.out.println(s));

// Zincirleme - andThen()
Consumer&lt;String&gt; c1 = s -> System.out.print(s);
Consumer&lt;String&gt; c2 = s -> System.out.println("!");
c1.andThen(c2).accept("Merhaba");  // "Merhaba!"</pre>
        <p><strong>Ne Zaman Kullanılır:</strong> Yan etki (side effect) yaratmak istediğinizde - ekrana yazdırma, dosyaya yazma, database'e kaydetme gibi.</p>`,
      exercises: [
        {
          id: 'consumer-1',
          title: 'Kare Yazdırma',
          description: 'Bir sayının karesini hesaplayıp yazdıran Consumer yazın.',
          difficulty: '🟢',
          starterCode: `import java.util.function.Consumer;

public class Main {
    public static void main(String[] args) {
        // TODO: Consumer<Integer> kareYazdir = ...
        
        kareYazdir.accept(5);
        kareYazdir.accept(7);
    }
}`,
          solution: `import java.util.function.Consumer;

public class Main {
    public static void main(String[] args) {
        Consumer<Integer> kareYazdir = n -> System.out.println(n * n);
        
        kareYazdir.accept(5);
        kareYazdir.accept(7);
    }
}`,
          hints: [
            'Consumer void döndürür',
            'Lambda: n -> System.out.println(n * n)',
            'accept() ile kullanın'
          ],
          expectedOutput: "25\n49"
        },
        {
          id: 'consumer-2',
          title: 'Consumer Zincirleme',
          description: 'İki Consumer oluşturun: biri sayıyı yazdırsın, diğeri karesini. andThen() ile zincirleyin.',
          difficulty: '🟡',
          starterCode: `import java.util.function.Consumer;

public class Main {
    public static void main(String[] args) {
        // TODO: Consumer<Integer> c1 = ... (sayıyı yazdır)
        // TODO: Consumer<Integer> c2 = ... (karesini yazdır)
        // TODO: Zincirleyin ve kullanın
        
        c1.andThen(c2).accept(5);
    }
}`,
          solution: `import java.util.function.Consumer;

public class Main {
    public static void main(String[] args) {
        Consumer<Integer> c1 = n -> System.out.println("Sayı: " + n);
        Consumer<Integer> c2 = n -> System.out.println("Karesi: " + (n * n));
        
        c1.andThen(c2).accept(5);
    }
}`,
          hints: [
            'İki ayrı Consumer tanımlayın',
            'andThen() birinci önce, ikinci sonra çalışır',
            'c1.andThen(c2).accept(5) kullanın'
          ],
          expectedOutput: "Sayı: 5\nKaresi: 25"
        }
      ]
    },
    {
      id: 'predicate',
      title: '🔍 Bölüm 3: Predicate',
      content: `<h3>Predicate - Test Edici</h3>
        <p>Predicate, bir değer alır ve boolean döndürür. Filtreleme ve test işlemlerinde kullanılır. Stream API'deki filter() metodu Predicate alır.</p>
        <h4>Tanımı:</h4>
        <pre>@FunctionalInterface
public interface Predicate&lt;T&gt; {
    boolean test(T t);
    
    default Predicate&lt;T&gt; and(Predicate&lt;T&gt; other) {...}
    default Predicate&lt;T&gt; or(Predicate&lt;T&gt; other) {...}
    default Predicate&lt;T&gt; negate() {...}
}</pre>
        <h4>Mantıksal Operatörler:</h4>
        <pre>Predicate&lt;Integer&gt; cift = n -> n % 2 == 0;
Predicate&lt;Integer&gt; pozitif = n -> n > 0;

// AND - Her ikisi de true olmalı
Predicate&lt;Integer&gt; ciftVePozitif = cift.and(pozitif);

// OR - En az biri true olmalı
Predicate&lt;Integer&gt; ciftVeyaPozitif = cift.or(pozitif);

// NEGATE - Tersini al
Predicate&lt;Integer&gt; tek = cift.negate();</pre>`,
      exercises: [
        {
          id: 'predicate-1',
          title: 'Pozitif Test',
          description: 'Pozitif sayı testi yapan Predicate yazın ve birkaç sayıyla test edin.',
          difficulty: '🟢',
          starterCode: `import java.util.function.Predicate;

public class Main {
    public static void main(String[] args) {
        // TODO: Predicate<Integer> pozitif = ...
        
        System.out.println("5 pozitif: " + pozitif.test(5));
        System.out.println("-3 pozitif: " + pozitif.test(-3));
        System.out.println("0 pozitif: " + pozitif.test(0));
    }
}`,
          solution: `import java.util.function.Predicate;

public class Main {
    public static void main(String[] args) {
        Predicate<Integer> pozitif = n -> n > 0;
        
        System.out.println("5 pozitif: " + pozitif.test(5));
        System.out.println("-3 pozitif: " + pozitif.test(-3));
        System.out.println("0 pozitif: " + pozitif.test(0));
    }
}`,
          hints: [
            'Pozitif: n > 0',
            'test() metodu boolean döndürür',
            'Sıfır pozitif değildir'
          ],
          expectedOutput: "5 pozitif: true\n-3 pozitif: false\n0 pozitif: false"
        },
        {
          id: 'predicate-2',
          title: 'AND Operatörü',
          description: 'Çift VE pozitif sayıları test eden birleşik Predicate oluşturun.',
          difficulty: '🟡',
          starterCode: `import java.util.function.Predicate;

public class Main {
    public static void main(String[] args) {
        // TODO: Predicate<Integer> cift = ...
        // TODO: Predicate<Integer> pozitif = ...
        // TODO: and() ile birleştirin
        
        System.out.println("4: " + birlesik.test(4));
        System.out.println("-4: " + birlesik.test(-4));
        System.out.println("5: " + birlesik.test(5));
    }
}`,
          solution: `import java.util.function.Predicate;

public class Main {
    public static void main(String[] args) {
        Predicate<Integer> cift = n -> n % 2 == 0;
        Predicate<Integer> pozitif = n -> n > 0;
        Predicate<Integer> birlesik = cift.and(pozitif);
        
        System.out.println("4: " + birlesik.test(4));
        System.out.println("-4: " + birlesik.test(-4));
        System.out.println("5: " + birlesik.test(5));
    }
}`,
          hints: [
            'İki ayrı Predicate tanımlayın',
            'and() metodu her ikisi de true ise true döner',
            '4 hem çift hem pozitif → true'
          ],
          expectedOutput: "4: true\n-4: false\n5: false"
        }
      ]
    },
    {
      id: 'function',
      title: '🔄 Bölüm 4: Function',
      content: `<h3>Function - Dönüştürücü</h3>
        <p>Function, bir tip alır ve başka bir tip döndürür. Veri dönüşümlerinde kullanılır. Stream API'deki map() metodu Function alır.</p>
        <h4>Tanımı:</h4>
        <pre>@FunctionalInterface
public interface Function&lt;T, R&gt; {
    R apply(T t);
    
    default &lt;V&gt; Function&lt;T, V&gt; andThen(Function&lt;R, V&gt; after) {...}
    default &lt;V&gt; Function&lt;V, R&gt; compose(Function&lt;V, T&gt; before) {...}
    static &lt;T&gt; Function&lt;T, T&gt; identity() {...}
}</pre>
        <h4>andThen vs compose:</h4>
        <pre>Function&lt;Integer, Integer&gt; ikiKat = x -> x * 2;
Function&lt;Integer, Integer&gt; onEkle = x -> x + 10;

// andThen: Önce bu, sonra o
ikiKat.andThen(onEkle).apply(5);  // (5*2) + 10 = 20

// compose: Önce o, sonra bu
ikiKat.compose(onEkle).apply(5);  // (5+10) * 2 = 30</pre>`,
      exercises: [
        {
          id: 'function-1',
          title: 'String Uzunluğu',
          description: 'String uzunluğunu döndüren Function yazın.',
          difficulty: '🟢',
          starterCode: `import java.util.function.Function;

public class Main {
    public static void main(String[] args) {
        // TODO: Function<String, Integer> uzunluk = ...
        
        System.out.println("Java: " + uzunluk.apply("Java"));
        System.out.println("Lambda: " + uzunluk.apply("Lambda"));
    }
}`,
          solution: `import java.util.function.Function;

public class Main {
    public static void main(String[] args) {
        Function<String, Integer> uzunluk = s -> s.length();
        
        System.out.println("Java: " + uzunluk.apply("Java"));
        System.out.println("Lambda: " + uzunluk.apply("Lambda"));
    }
}`,
          hints: [
            'Function<String, Integer> - String alır, Integer döner',
            'String::length veya s -> s.length()',
            'apply() ile kullanın'
          ],
          expectedOutput: "Java: 4\nLambda: 6"
        },
        {
          id: 'function-2',
          title: 'Function Zincirleme',
          description: 'ikiKat ve onEkle fonksiyonlarını andThen() ile zincirleyin.',
          difficulty: '🟡',
          starterCode: `import java.util.function.Function;

public class Main {
    public static void main(String[] args) {
        // TODO: Function<Integer, Integer> ikiKat = ...
        // TODO: Function<Integer, Integer> onEkle = ...
        // TODO: andThen ile zincirleyin
        
        System.out.println("Sonuç: " + zincir.apply(5));
    }
}`,
          solution: `import java.util.function.Function;

public class Main {
    public static void main(String[] args) {
        Function<Integer, Integer> ikiKat = x -> x * 2;
        Function<Integer, Integer> onEkle = x -> x + 10;
        Function<Integer, Integer> zincir = ikiKat.andThen(onEkle);
        
        System.out.println("Sonuç: " + zincir.apply(5));
    }
}`,
          hints: [
            'andThen: önce ikiKat, sonra onEkle',
            '5 * 2 = 10, sonra 10 + 10 = 20',
            'andThen() ile zincir oluşturun'
          ],
          expectedOutput: "Sonuç: 20"
        }
      ]
    },
    {
      id: 'supplier',
      title: '🎁 Bölüm 5: Supplier',
      content: `<h3>Supplier - Üretici</h3>
        <p>Supplier, parametre almaz ama bir değer döndürür. Lazy initialization ve değer üretme işlemlerinde kullanılır.</p>
        <h4>Tanımı:</h4>
        <pre>@FunctionalInterface
public interface Supplier&lt;T&gt; {
    T get();
}</pre>
        <h4>Kullanım Alanları:</h4>
        <pre>// Rastgele değer üretme
Supplier&lt;Double&gt; rastgele = () -> Math.random();

// Lazy initialization
Supplier&lt;List&lt;String&gt;&gt; listFactory = ArrayList::new;

// Optional ile
Optional.empty().orElseGet(() -> "Default");

// Sonsuz stream
Stream.generate(() -> Math.random()).limit(5)</pre>`,
      exercises: [
        {
          id: 'supplier-1',
          title: 'Mesaj Üretici',
          description: '"Merhaba Lambda!" döndüren Supplier yazın.',
          difficulty: '🟢',
          starterCode: `import java.util.function.Supplier;

public class Main {
    public static void main(String[] args) {
        // TODO: Supplier<String> mesaj = ...
        
        System.out.println(mesaj.get());
        System.out.println(mesaj.get());
    }
}`,
          solution: `import java.util.function.Supplier;

public class Main {
    public static void main(String[] args) {
        Supplier<String> mesaj = () -> "Merhaba Lambda!";
        
        System.out.println(mesaj.get());
        System.out.println(mesaj.get());
    }
}`,
          hints: [
            'Parametre yok: ()',
            'Lambda: () -> "Merhaba Lambda!"',
            'get() ile değeri alın'
          ],
          expectedOutput: "Merhaba Lambda!\nMerhaba Lambda!"
        },
        {
          id: 'supplier-2',
          title: 'Sayaç Supplier',
          description: 'Her çağrıldığında artan bir sayı döndüren Supplier yazın (AtomicInteger kullanın).',
          difficulty: '🔴',
          starterCode: `import java.util.function.Supplier;
import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    public static void main(String[] args) {
        // TODO: AtomicInteger counter oluşturun
        // TODO: Supplier<Integer> sayac = ... (counter.incrementAndGet() kullanın)
        
        System.out.println(sayac.get());
        System.out.println(sayac.get());
        System.out.println(sayac.get());
    }
}`,
          solution: `import java.util.function.Supplier;
import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    public static void main(String[] args) {
        AtomicInteger counter = new AtomicInteger(0);
        Supplier<Integer> sayac = counter::incrementAndGet;
        
        System.out.println(sayac.get());
        System.out.println(sayac.get());
        System.out.println(sayac.get());
    }
}`,
          hints: [
            'AtomicInteger thread-safe sayaç sağlar',
            'incrementAndGet() artırıp yeni değeri döner',
            'Method reference kullanabilirsiniz'
          ],
          expectedOutput: "1\n2\n3"
        }
      ]
    },
    {
      id: 'unary-binary',
      title: '🔄 Bölüm 6: Operator\'ler',
      content: `<h3>UnaryOperator ve BinaryOperator</h3>
        <p>Bu operatörler Function'ın özel versiyonlarıdır. Girdi ve çıktı tipi aynıdır.</p>
        <h4>UnaryOperator - Tek Parametre:</h4>
        <pre>@FunctionalInterface
public interface UnaryOperator&lt;T&gt; extends Function&lt;T, T&gt; {
    // T apply(T t);
}

// Kullanım
UnaryOperator&lt;Integer&gt; ikiKat = x -> x * 2;
UnaryOperator&lt;String&gt; buyukHarf = String::toUpperCase;</pre>
        <h4>BinaryOperator - İki Parametre:</h4>
        <pre>@FunctionalInterface
public interface BinaryOperator&lt;T&gt; extends BiFunction&lt;T, T, T&gt; {
    // T apply(T t1, T t2);
    
    static &lt;T&gt; BinaryOperator&lt;T&gt; minBy(Comparator&lt;T&gt; c) {...}
    static &lt;T&gt; BinaryOperator&lt;T&gt; maxBy(Comparator&lt;T&gt; c) {...}
}

// Kullanım
BinaryOperator&lt;Integer&gt; topla = (a, b) -> a + b;
BinaryOperator&lt;Integer&gt; max = BinaryOperator.maxBy(Integer::compare);</pre>`,
      exercises: [
        {
          id: 'operator-1',
          title: 'UnaryOperator Kullanımı',
          description: 'String\'e prefix ekleyen UnaryOperator yazın.',
          difficulty: '🟢',
          starterCode: `import java.util.function.UnaryOperator;

public class Main {
    public static void main(String[] args) {
        // TODO: UnaryOperator<String> prefixEkle = ...
        // ">>> " ekleyin
        
        System.out.println(prefixEkle.apply("Java"));
        System.out.println(prefixEkle.apply("Lambda"));
    }
}`,
          solution: `import java.util.function.UnaryOperator;

public class Main {
    public static void main(String[] args) {
        UnaryOperator<String> prefixEkle = s -> ">>> " + s;
        
        System.out.println(prefixEkle.apply("Java"));
        System.out.println(prefixEkle.apply("Lambda"));
    }
}`,
          hints: [
            'UnaryOperator<String> - String alır, String döner',
            'Lambda: s -> ">>> " + s',
            'apply() ile kullanın'
          ],
          expectedOutput: ">>> Java\n>>> Lambda"
        },
        {
          id: 'operator-2',
          title: 'BinaryOperator ile Maximum',
          description: 'maxBy() kullanarak iki sayıdan büyüğünü bulan BinaryOperator yazın.',
          difficulty: '🟡',
          starterCode: `import java.util.function.BinaryOperator;

public class Main {
    public static void main(String[] args) {
        // TODO: BinaryOperator.maxBy() kullanın
        
        System.out.println("Max(10, 20): " + maxBul.apply(10, 20));
        System.out.println("Max(50, 30): " + maxBul.apply(50, 30));
    }
}`,
          solution: `import java.util.function.BinaryOperator;

public class Main {
    public static void main(String[] args) {
        BinaryOperator<Integer> maxBul = BinaryOperator.maxBy(Integer::compare);
        
        System.out.println("Max(10, 20): " + maxBul.apply(10, 20));
        System.out.println("Max(50, 30): " + maxBul.apply(50, 30));
    }
}`,
          hints: [
            'BinaryOperator.maxBy() static metodu',
            'Comparator gerekir: Integer::compare',
            'İki değerden büyüğünü döner'
          ],
          expectedOutput: "Max(10, 20): 20\nMax(50, 30): 50"
        }
      ]
    },
    {
      id: 'method-ref',
      title: '🔗 Bölüm 7: Method Reference',
      content: `<h3>Method Reference</h3>
        <p>Lambda'yı daha da kısaltır. Lambda sadece bir metodu çağırıyorsa, method reference kullanabiliriz.</p>
        <h4>4 Tür Method Reference:</h4>
        <pre>// 1. Static Method
Function&lt;String, Integer&gt; parseInt = Integer::parseInt;

// 2. Instance Method (belirli nesne)
String str = "test";
Supplier&lt;Integer&gt; uzunluk = str::length;

// 3. Instance Method (keyfi nesne)
Function&lt;String, Integer&gt; uzunluk = String::length;

// 4. Constructor
Supplier&lt;List&lt;String&gt;&gt; listFactory = ArrayList::new;</pre>
        <h4>Lambda vs Method Reference:</h4>
        <pre>// Lambda
s -> System.out.println(s)
// Method Reference
System.out::println

// Lambda
x -> x.toUpperCase()
// Method Reference
String::toUpperCase</pre>`,
      exercises: [
        {
          id: 'method-ref-1',
          title: 'Method Reference Kullanımı',
          description: 'Liste elemanlarını method reference ile yazdırın.',
          difficulty: '🟢',
          starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<String> liste = Arrays.asList("Java", "Lambda", "Stream");
        
        // TODO: Method reference ile forEach kullanın
        
    }
}`,
          solution: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<String> liste = Arrays.asList("Java", "Lambda", "Stream");
        
        liste.forEach(System.out::println);
    }
}`,
          hints: [
            'System.out::println kullanın',
            'forEach() terminal operation',
            's -> System.out.println(s) yerine kısa yol'
          ],
          expectedOutput: "Java\nLambda\nStream"
        },
        {
          id: 'method-ref-2',
          title: 'Constructor Reference',
          description: 'ArrayList constructor reference kullanarak yeni liste oluşturun.',
          difficulty: '🟡',
          starterCode: `import java.util.*;
import java.util.function.Supplier;

public class Main {
    public static void main(String[] args) {
        // TODO: Supplier<List<String>> listFactory = ...
        // Constructor reference kullanın
        
        List<String> liste1 = listFactory.get();
        liste1.add("Test");
        
        System.out.println("Liste 1: " + liste1);
        
        List<String> liste2 = listFactory.get();
        liste2.add("Başka");
        
        System.out.println("Liste 2: " + liste2);
    }
}`,
          solution: `import java.util.*;
import java.util.function.Supplier;

public class Main {
    public static void main(String[] args) {
        Supplier<List<String>> listFactory = ArrayList::new;
        
        List<String> liste1 = listFactory.get();
        liste1.add("Test");
        
        System.out.println("Liste 1: " + liste1);
        
        List<String> liste2 = listFactory.get();
        liste2.add("Başka");
        
        System.out.println("Liste 2: " + liste2);
    }
}`,
          hints: [
            'ArrayList::new constructor reference',
            'Her get() çağrısı yeni liste oluşturur',
            'Supplier<List<String>> tipi kullanın'
          ],
          expectedOutput: "Liste 1: [Test]\nListe 2: [Başka]"
        }
      ]
    },
    {
      id: 'stream-basics',
      title: '🌊 Bölüm 8: Stream Temelleri',
      content: `<h3>Stream API Nedir?</h3>
        <p>Stream, veri koleksiyonları üzerinde fonksiyonel operasyonlar yapmamızı sağlar. Declarative (bildirimsel) programlama tarzıdır.</p>
        <h4>Önemli Özellikler:</h4>
        <ul>
          <li><strong>No Storage:</strong> Stream veri saklamaz</li>
          <li><strong>Functional:</strong> Kaynak veriyi değiştirmez</li>
          <li><strong>Lazy:</strong> Terminal operation çağrılana kadar işlem yapmaz</li>
          <li><strong>Consumable:</strong> Bir kez kullanılır</li>
        </ul>
        <h4>Stream Pipeline:</h4>
        <pre>kaynak.stream()              // Stream oluştur
    .filter(...)             // Intermediate operation
    .map(...)                // Intermediate operation
    .collect(...)            // Terminal operation</pre>
        <h4>Stream Oluşturma:</h4>
        <pre>// Collection'dan
liste.stream()

// Array'den
Arrays.stream(dizi)

// Değerlerden
Stream.of(1, 2, 3)

// Generate
Stream.generate(() -> Math.random()).limit(5)

// Iterate
Stream.iterate(0, n -> n + 2).limit(10)</pre>`,
      exercises: [
        {
          id: 'stream-1',
          title: 'İlk Stream',
          description: 'Liste oluşturup stream\'e çevirin ve forEach ile yazdırın.',
          difficulty: '🟢',
          starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 2, 3, 4, 5);
        
        // TODO: Stream\'e çevirin ve forEach ile yazdırın
        
    }
}`,
          solution: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 2, 3, 4, 5);
        
        sayilar.stream()
            .forEach(System.out::println);
    }
}`,
          hints: [
            'liste.stream() ile stream oluşturun',
            'forEach(System.out::println) yazdırır',
            'Terminal operation gerekli'
          ],
          expectedOutput: "1\n2\n3\n4\n5"
        },
        {
          id: 'stream-2',
          title: 'Stream Generate',
          description: 'Stream.generate() ile 5 rastgele sayı üretin ve yazdırın.',
          difficulty: '🟡',
          starterCode: `import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        // TODO: Stream.generate() kullanın
        // Math.random() ile rastgele sayı
        // limit(5) ile sınırlayın
        
    }
}`,
          solution: `import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Stream.generate(() -> Math.random())
            .limit(5)
            .forEach(System.out::println);
    }
}`,
          hints: [
            'Stream.generate(() -> Math.random())',
            'limit(5) ile 5 tane al',
            'forEach ile yazdır'
          ],
          expectedOutput: "0.123456789\n0.987654321\n0.456789123\n0.789123456\n0.321654987"
        }
      ]
    },
    {
      id: 'stream-filter',
      title: '🌊 Bölüm 9: filter()',
      content: `<h3>filter() - Filtreleme</h3>
        <p>Predicate alır ve koşulu sağlayan elemanları geçirir. Intermediate operation'dır.</p>
        <h4>Syntax:</h4>
        <pre>Stream&lt;T&gt; filter(Predicate&lt;? super T&gt; predicate)</pre>
        <h4>Kullanım:</h4>
        <pre>// Çift sayılar
sayilar.stream()
    .filter(n -> n % 2 == 0)
    .collect(Collectors.toList());

// Çoklu filter
students.stream()
    .filter(s -> s.getGpa() >= 3.5)
    .filter(s -> s.getGrade() >= 3)
    .collect(Collectors.toList());

// Tek filter, çoklu koşul
students.stream()
    .filter(s -> s.getGpa() >= 3.5 && s.getGrade() >= 3)
    .collect(Collectors.toList());</pre>
        <p><strong>İpucu:</strong> Her filter ayrı bir kontrol noktasıdır. Okunabilirlik için çoklu filter tercih edilebilir.</p>`,
      exercises: [
        {
          id: 'filter-1',
          title: 'Çift Sayıları Filtrele',
          description: 'Çift sayıları filtreleyin ve yeni listeye toplayın.',
          difficulty: '🟢',
          starterCode: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8);
        
        // TODO: Çift sayıları filtreleyin
        
        System.out.println("Çiftler: " + ciftler);
    }
}`,
          solution: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8);
        
        List<Integer> ciftler = sayilar.stream()
            .filter(n -> n % 2 == 0)
            .collect(Collectors.toList());
        
        System.out.println("Çiftler: " + ciftler);
    }
}`,
          hints: [
            'Çift: n % 2 == 0',
            'filter() ile filtreleyin',
            'collect(Collectors.toList()) ile toplayın'
          ],
          expectedOutput: "Çiftler: [2, 4, 6, 8]"
        },
        {
          id: 'filter-2',
          title: 'Çoklu Filtreleme',
          description: '10\'dan büyük VE çift olan sayıları bulun.',
          difficulty: '🟡',
          starterCode: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(5, 10, 15, 20, 25, 30);
        
        // TODO: İki filter kullanın
        // 1) 10'dan büyük
        // 2) Çift
        
        System.out.println("Sonuç: " + sonuc);
    }
}`,
          solution: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(5, 10, 15, 20, 25, 30);
        
        List<Integer> sonuc = sayilar.stream()
            .filter(n -> n > 10)
            .filter(n -> n % 2 == 0)
            .collect(Collectors.toList());
        
        System.out.println("Sonuç: " + sonuc);
    }
}`,
          hints: [
            'filter(n -> n > 10)',
            'filter(n -> n % 2 == 0)',
            'İki filter art arda kullanın'
          ],
          expectedOutput: "Sonuç: [20, 30]"
        }
      ]
    },
    {
      id: 'stream-map',
      title: '🌊 Bölüm 10: map()',
      content: `<h3>map() - Dönüştürme</h3>
        <p>Function alır ve her elemanı dönüştürür. Tip değişikliği yapabilir. Intermediate operation'dır.</p>
        <h4>Syntax:</h4>
        <pre>&lt;R&gt; Stream&lt;R&gt; map(Function&lt;? super T, ? extends R&gt; mapper)</pre>
        <h4>Kullanım:</h4>
        <pre>// Integer -> String
sayilar.stream()
    .map(n -> "Sayı: " + n)
    .collect(Collectors.toList());

// Student -> String
students.stream()
    .map(Student::getName)
    .collect(Collectors.toList());

// Çoklu map (zincirleme)
students.stream()
    .map(Student::getName)
    .map(String::toUpperCase)
    .map(s -> s.charAt(0))
    .collect(Collectors.toList());</pre>
        <p><strong>map() vs filter():</strong> filter bazı elemanları atlar, map tüm elemanları dönüştürür.</p>`,
      exercises: [
        {
          id: 'map-1',
          title: 'Karelerini Al',
          description: 'Her sayının karesini alın.',
          difficulty: '🟢',
          starterCode: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 2, 3, 4, 5);
        
        // TODO: Kareleri alın
        
        System.out.println("Kareler: " + kareler);
    }
}`,
          solution: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 2, 3, 4, 5);
        
        List<Integer> kareler = sayilar.stream()
            .map(n -> n * n)
            .collect(Collectors.toList());
        
        System.out.println("Kareler: " + kareler);
    }
}`,
          hints: [
            'map: n -> n * n',
            'Her eleman dönüştürülür',
            'collect ile toplayın'
          ],
          expectedOutput: "Kareler: [1, 4, 9, 16, 25]"
        },
        {
          id: 'map-2',
          title: 'Büyük Harfe Çevir',
          description: 'String\'leri büyük harfe çevirin.',
          difficulty: '🟢',
          starterCode: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<String> kelimeler = Arrays.asList("java", "lambda", "stream");
        
        // TODO: Büyük harfe çevirin
        
        System.out.println(buyukler);
    }
}`,
          solution: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<String> kelimeler = Arrays.asList("java", "lambda", "stream");
        
        List<String> buyukler = kelimeler.stream()
            .map(String::toUpperCase)
            .collect(Collectors.toList());
        
        System.out.println(buyukler);
    }
}`,
          hints: [
            'String::toUpperCase method reference',
            'map ile dönüştürün',
            'Her string büyük harfe çevrilir'
          ],
          expectedOutput: "[JAVA, LAMBDA, STREAM]"
        },
        {
          id: 'map-3',
          title: 'Zincirleme map()',
          description: 'Sayıları önce iki katına çıkarın, sonra String\'e çevirin.',
          difficulty: '🟡',
          starterCode: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 2, 3, 4, 5);
        
        // TODO: İki map kullanın
        // 1) İki katını al
        // 2) "Sayı: X" formatında String\'e çevir
        
        System.out.println(sonuc);
    }
}`,
          solution: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 2, 3, 4, 5);
        
        List<String> sonuc = sayilar.stream()
            .map(n -> n * 2)
            .map(n -> "Sayı: " + n)
            .collect(Collectors.toList());
        
        System.out.println(sonuc);
    }
}`,
          hints: [
            'İlk map: n -> n * 2',
            'İkinci map: n -> "Sayı: " + n',
            'map zincirleme yapılabilir'
          ],
          expectedOutput: "[Sayı: 2, Sayı: 4, Sayı: 6, Sayı: 8, Sayı: 10]"
        }
      ]
    },
    {
      id: 'stream-flatmap',
      title: '🌊 Bölüm 11: flatMap()',
      content: `<h3>flatMap() - Düzleştirme</h3>
        <p>İç içe yapıları düzleştirir. Her eleman için bir stream döndürür ve bunları tek stream\'e birleştirir.</p>
        <h4>map() vs flatMap():</h4>
        <pre>// map: T -> R
map(s -> s.length())
// Her eleman -> bir değer

// flatMap: T -> Stream&lt;R&gt;
flatMap(s -> s.getList().stream())
// Her eleman -> bir stream
// Tüm streamler birleştirilir</pre>
        <h4>Görsel:</h4>
        <pre>map():
[[1,2], [3,4]] -> [List, List]

flatMap():
[[1,2], [3,4]] -> [1, 2, 3, 4]</pre>
        <h4>Kullanım:</h4>
        <pre>// Listeleri düzleştir
List&lt;List&lt;Integer&gt;&gt; nested = ...;
nested.stream()
    .flatMap(list -> list.stream())
    .collect(Collectors.toList());

// Kelime ayırma
cumleler.stream()
    .flatMap(s -> Arrays.stream(s.split(" ")))
    .collect(Collectors.toList());</pre>`,
      exercises: [
        {
          id: 'flatmap-1',
          title: 'Kelime Ayırma',
          description: 'Cümleleri kelimelere ayırın ve düzleştirin.',
          difficulty: '🟡',
          starterCode: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<String> cumleler = Arrays.asList("Java Lambda", "Stream API");
        
        // TODO: Kelimelere ayırın ve düzleştirin
        // split(" ") kullanın, Arrays.stream() ile stream yapın
        
        System.out.println(kelimeler);
    }
}`,
          solution: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<String> cumleler = Arrays.asList("Java Lambda", "Stream API");
        
        List<String> kelimeler = cumleler.stream()
            .flatMap(s -> Arrays.stream(s.split(" ")))
            .collect(Collectors.toList());
        
        System.out.println(kelimeler);
    }
}`,
          hints: [
            'split(" ") ile böl',
            'Arrays.stream() ile stream yap',
            'flatMap düzleştirir'
          ],
          expectedOutput: "[Java, Lambda, Stream, API]"
        },
        {
          id: 'flatmap-2',
          title: 'İç İçe Listeleri Düzleştir',
          description: 'List<List<Integer>>\'i List<Integer>\'a çevirin.',
          difficulty: '🟡',
          starterCode: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<List<Integer>> icIce = Arrays.asList(
            Arrays.asList(1, 2, 3),
            Arrays.asList(4, 5),
            Arrays.asList(6, 7, 8, 9)
        );
        
        // TODO: Düzleştirin
        
        System.out.println(duz);
    }
}`,
          solution: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<List<Integer>> icIce = Arrays.asList(
            Arrays.asList(1, 2, 3),
            Arrays.asList(4, 5),
            Arrays.asList(6, 7, 8, 9)
        );
        
        List<Integer> duz = icIce.stream()
            .flatMap(list -> list.stream())
            .collect(Collectors.toList());
        
        System.out.println(duz);
    }
}`,
          hints: [
            'flatMap(list -> list.stream())',
            'Her iç liste stream olur',
            'flatMap hepsini birleştirir'
          ],
          expectedOutput: "[1, 2, 3, 4, 5, 6, 7, 8, 9]"
        }
      ]
    },
    {
      id: 'stream-ops',
      title: '🌊 Bölüm 12: Diğer Operasyonlar',
      content: `<h3>Stream Operasyonları</h3>
        <h4>distinct() - Tekrarları Kaldır:</h4>
        <pre>List&lt;Integer&gt; tekil = liste.stream()
    .distinct()
    .collect(Collectors.toList());</pre>
        <h4>sorted() - Sırala:</h4>
        <pre>// Doğal sıralama
.sorted()

// Ters sıralama
.sorted(Comparator.reverseOrder())

// Özel sıralama
.sorted(Comparator.comparing(Student::getGpa))</pre>
        <h4>limit(n) - İlk n Eleman:</h4>
        <pre>// İlk 5 elemanı al
.limit(5)</pre>
        <h4>skip(n) - İlk n Elemanı Atla:</h4>
        <pre>// İlk 3'ü atla
.skip(3)</pre>
        <h4>peek() - Debug:</h4>
        <pre>// Her adımda ne olduğunu gör
.peek(x -> System.out.println("Değer: " + x))</pre>`,
      exercises: [
        {
          id: 'ops-1',
          title: 'Sıralama ve Limit',
          description: 'En büyük 3 sayıyı bulun.',
          difficulty: '🟡',
          starterCode: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(5, 2, 8, 1, 9, 3, 7);
        
        // TODO: Tersten sıralayın ve ilk 3'ünü alın
        
        System.out.println("En büyük 3: " + enBuyukUc);
    }
}`,
          solution: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(5, 2, 8, 1, 9, 3, 7);
        
        List<Integer> enBuyukUc = sayilar.stream()
            .sorted(Comparator.reverseOrder())
            .limit(3)
            .collect(Collectors.toList());
        
        System.out.println("En büyük 3: " + enBuyukUc);
    }
}`,
          hints: [
            'sorted(Comparator.reverseOrder())',
            'limit(3) ile ilk 3\'ü al',
            'Büyükten küçüğe sıralanır'
          ],
          expectedOutput: "En büyük 3: [9, 8, 7]"
        },
        {
          id: 'ops-2',
          title: 'distinct() Kullanımı',
          description: 'Tekrar eden elemanları kaldırıp sıralayın.',
          difficulty: '🟢',
          starterCode: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(5, 2, 8, 2, 9, 5, 7, 8);
        
        // TODO: Tekrarları kaldırın ve sıralayın
        
        System.out.println("Tekil ve sıralı: " + sonuc);
    }
}`,
          solution: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(5, 2, 8, 2, 9, 5, 7, 8);
        
        List<Integer> sonuc = sayilar.stream()
            .distinct()
            .sorted()
            .collect(Collectors.toList());
        
        System.out.println("Tekil ve sıralı: " + sonuc);
    }
}`,
          hints: [
            'distinct() tekrarları kaldırır',
            'sorted() sıralar',
            'Zincirleme yapın'
          ],
          expectedOutput: "Tekil ve sıralı: [2, 5, 7, 8, 9]"
        }
      ]
    },
    {
      id: 'collect',
      title: '🌊 Bölüm 13: collect()',
      content: `<h3>collect() - Toplama ve Dönüştürme</h3>
        <p>Stream sonucunu bir koleksiyona veya başka bir yapıya toplar. Terminal operation\'dır.</p>
        <h4>Collectors Utility:</h4>
        <pre>// Liste
.collect(Collectors.toList())

// Set
.collect(Collectors.toSet())

// String birleştirme
.collect(Collectors.joining(", "))

// Map
.collect(Collectors.toMap(k -> k, v -> v))

// Gruplama
.collect(Collectors.groupingBy(Student::getGrade))

// Sayma
.collect(Collectors.counting())

// Toplama
.collect(Collectors.summingInt(Student::getAge))</pre>`,
      exercises: [
        {
          id: 'collect-1',
          title: 'String Birleştirme',
          description: 'Kelimeleri virgülle birleştirin.',
          difficulty: '🟢',
          starterCode: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<String> kelimeler = Arrays.asList("Java", "Lambda", "Stream");
        
        // TODO: Virgülle birleştirin
        
        System.out.println(sonuc);
    }
}`,
          solution: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<String> kelimeler = Arrays.asList("Java", "Lambda", "Stream");
        
        String sonuc = kelimeler.stream()
            .collect(Collectors.joining(", "));
        
        System.out.println(sonuc);
    }
}`,
          hints: [
            'Collectors.joining(", ")',
            'String döndürür',
            'Virgül ve boşlukla ayırır'
          ],
          expectedOutput: "Java, Lambda, Stream"
        },
        {
          id: 'collect-2',
          title: 'Set\'e Toplama',
          description: 'Tekrar eden sayıları Set\'e toplayın.',
          difficulty: '🟢',
          starterCode: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 2, 2, 3, 3, 3, 4, 5, 5);
        
        // TODO: Set'e toplayın (tekrarlar otomatik kalkacak)
        
        System.out.println(tekil);
    }
}`,
          solution: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 2, 2, 3, 3, 3, 4, 5, 5);
        
        Set<Integer> tekil = sayilar.stream()
            .collect(Collectors.toSet());
        
        System.out.println(tekil);
    }
}`,
          hints: [
            'Collectors.toSet()',
            'Set tekrar kabul etmez',
            'Otomatik distinct olur'
          ],
          expectedOutput: "[1, 2, 3, 4, 5]"
        }
      ]
    },
    {
      id: 'reduce',
      title: '🌊 Bölüm 14: reduce()',
      content: `<h3>reduce() - İndirgeme</h3>
        <p>Stream elemanlarını tek değere indirgir. BinaryOperator alır. Terminal operation\'dır.</p>
        <h4>Syntax:</h4>
        <pre>// İki parametre: başlangıç değeri ve accumulator
T reduce(T identity, BinaryOperator&lt;T&gt; accumulator)

// Tek parametre: sadece accumulator, Optional döner
Optional&lt;T&gt; reduce(BinaryOperator&lt;T&gt; accumulator)</pre>
        <h4>Kullanım:</h4>
        <pre>// Toplama
int toplam = sayilar.stream()
    .reduce(0, (a, b) -> a + b);
// veya
int toplam = sayilar.stream()
    .reduce(0, Integer::sum);

// Çarpma
int carpim = sayilar.stream()
    .reduce(1, (a, b) -> a * b);

// Maximum
Optional&lt;Integer&gt; max = sayilar.stream()
    .reduce(Integer::max);

// String birleştirme
String sonuc = kelimeler.stream()
    .reduce("", (a, b) -> a + b);</pre>
        <p><strong>Identity:</strong> Başlangıç değeri ve neutral element. Toplama için 0, çarpma için 1.</p>`,
      exercises: [
        {
          id: 'reduce-1',
          title: 'Sayıları Toplama',
          description: 'reduce() ile sayıları toplayın.',
          difficulty: '🟡',
          starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 2, 3, 4, 5);
        
        // TODO: reduce ile toplam bulun
        
        System.out.println("Toplam: " + toplam);
    }
}`,
          solution: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 2, 3, 4, 5);
        
        int toplam = sayilar.stream()
            .reduce(0, (a, b) -> a + b);
        
        System.out.println("Toplam: " + toplam);
    }
}`,
          hints: [
            'reduce(0, (a, b) -> a + b)',
            '0 başlangıç değeri',
            'Integer::sum da kullanılabilir'
          ],
          expectedOutput: "Toplam: 15"
        },
        {
          id: 'reduce-2',
          title: 'Maximum Bulma',
          description: 'reduce() ile en büyük sayıyı bulun.',
          difficulty: '🟡',
          starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(5, 12, 3, 8, 20, 7);
        
        // TODO: reduce ile maximum bulun
        // Optional döner!
        
        max.ifPresent(m -> System.out.println("Max: " + m));
    }
}`,
          solution: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(5, 12, 3, 8, 20, 7);
        
        Optional<Integer> max = sayilar.stream()
            .reduce(Integer::max);
        
        max.ifPresent(m -> System.out.println("Max: " + m));
    }
}`,
          hints: [
            'reduce(Integer::max)',
            'İki değerden büyüğünü seç',
            'Optional döner çünkü liste boş olabilir'
          ],
          expectedOutput: "Max: 20"
        },
        {
          id: 'reduce-3',
          title: 'Kompleks Pipeline',
          description: 'Çift sayıların karelerinin toplamını bulun.',
          difficulty: '🔴',
          starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 2, 3, 4, 5, 6);
        
        // TODO: 1) Çift olanları filtrele
        //       2) Karelerini al
        //       3) Topla
        
        System.out.println("Sonuç: " + sonuc);
    }
}`,
          solution: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 2, 3, 4, 5, 6);
        
        int sonuc = sayilar.stream()
            .filter(n -> n % 2 == 0)
            .map(n -> n * n)
            .reduce(0, Integer::sum);
        
        System.out.println("Sonuç: " + sonuc);
    }
}`,
          hints: [
            'filter -> map -> reduce',
            'Çiftler: 2, 4, 6',
            'Kareler: 4, 16, 36',
            'Toplam: 56'
          ],
          expectedOutput: "Sonuç: 56"
        }
      ]
    },
    {
      id: 'optional',
      title: '📦 Bölüm 15: Optional',
      content: `<h3>Optional - Null Güvenli Kodlama</h3>
        <p>Optional, değerin var olup olmadığını temsil eder. NullPointerException\'dan kaçınmamızı sağlar.</p>
        <h4>Optional Oluşturma:</h4>
        <pre>// Değer varsa
Optional&lt;String&gt; opt1 = Optional.of("test");

// Değer null olabilirse
Optional&lt;String&gt; opt2 = Optional.ofNullable(null);

// Boş Optional
Optional&lt;String&gt; opt3 = Optional.empty();</pre>
        <h4>Değer Kontrol:</h4>
        <pre>// Var mı?
if (opt.isPresent()) {
    String value = opt.get();
}

// Lambda ile
opt.ifPresent(v -> System.out.println(v));

// Boş mu?
if (opt.isEmpty()) { // Java 11+
    System.out.println("Boş");
}</pre>
        <h4>Varsayılan Değer:</h4>
        <pre>// orElse: Her zaman çalışır
String s1 = opt.orElse("default");

// orElseGet: Sadece boşsa çalışır
String s2 = opt.orElseGet(() -> "default");

// orElseThrow: Boşsa exception fırlat
String s3 = opt.orElseThrow();</pre>`,
      exercises: [
        {
          id: 'optional-1',
          title: 'Optional Temel Kullanım',
          description: 'Optional oluşturun ve ifPresent() ile yazdırın.',
          difficulty: '🟢',
          starterCode: `import java.util.Optional;

public class Main {
    public static void main(String[] args) {
        // TODO: Optional<String> oluşturun, içinde "Lambda" olsun
        // TODO: ifPresent ile yazdırın
        
        Optional<String> bos = Optional.empty();
        // TODO: Bu boş Optional'ı da ifPresent ile yazdırmayı deneyin
        
    }
}`,
          solution: `import java.util.Optional;

public class Main {
    public static void main(String[] args) {
        Optional<String> opt = Optional.of("Lambda");
        opt.ifPresent(s -> System.out.println("Değer: " + s));
        
        Optional<String> bos = Optional.empty();
        bos.ifPresent(s -> System.out.println("Bu yazdırılmaz"));
        System.out.println("Boş Optional yazdırılmadı");
    }
}`,
          hints: [
            'Optional.of("Lambda")',
            'ifPresent(System.out::println)',
            'Boş Optional için ifPresent çalışmaz'
          ],
          expectedOutput: "Değer: Lambda\nBoş Optional yazdırılmadı"
        },
        {
          id: 'optional-2',
          title: 'orElse Kullanımı',
          description: 'Boş Optional için varsayılan değer döndürün.',
          difficulty: '🟡',
          starterCode: `import java.util.Optional;

public class Main {
    public static void main(String[] args) {
        Optional<String> opt1 = Optional.of("Var");
        Optional<String> opt2 = Optional.empty();
        
        // TODO: orElse ile varsayılan değer kullanın
        
        System.out.println("Opt1: " + deger1);
        System.out.println("Opt2: " + deger2);
    }
}`,
          solution: `import java.util.Optional;

public class Main {
    public static void main(String[] args) {
        Optional<String> opt1 = Optional.of("Var");
        Optional<String> opt2 = Optional.empty();
        
        String deger1 = opt1.orElse("Varsayılan");
        String deger2 = opt2.orElse("Varsayılan");
        
        System.out.println("Opt1: " + deger1);
        System.out.println("Opt2: " + deger2);
    }
}`,
          hints: [
            'orElse("Varsayılan")',
            'Değer varsa onu, yoksa varsayılanı döner',
            'Her durumda String döner'
          ],
          expectedOutput: "Opt1: Var\nOpt2: Varsayılan"
        }
      ]
    },
    {
      id: 'terminal-ops',
      title: '🎯 Bölüm 16: Terminal Operasyonlar',
      content: `<h3>Terminal Operations</h3>
        <p>Stream\'i sonlandıran ve sonuç üreten operasyonlar.</p>
        <h4>forEach() - Her Eleman İçin:</h4>
        <pre>.forEach(System.out::println)</pre>
        <h4>count() - Sayma:</h4>
        <pre>long sayi = stream.count();</pre>
        <h4>min() / max() - Minimum / Maximum:</h4>
        <pre>Optional&lt;Integer&gt; min = stream.min(Integer::compare);
Optional&lt;Integer&gt; max = stream.max(Integer::compare);</pre>
        <h4>findFirst() / findAny():</h4>
        <pre>Optional&lt;T&gt; ilk = stream.findFirst();
Optional&lt;T&gt; herhangi = stream.findAny();</pre>
        <h4>anyMatch() / allMatch() / noneMatch():</h4>
        <pre>boolean varMi = stream.anyMatch(n -> n > 10);
boolean hepsi = stream.allMatch(n -> n > 0);
boolean hicbiri = stream.noneMatch(n -> n < 0);</pre>`,
      exercises: [
        {
          id: 'terminal-1',
          title: 'count() Kullanımı',
          description: 'Çift sayıları sayın.',
          difficulty: '🟢',
          starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8);
        
        // TODO: Çift sayıları filtreleyin ve sayın
        
        System.out.println("Çift sayı adedi: " + adet);
    }
}`,
          solution: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8);
        
        long adet = sayilar.stream()
            .filter(n -> n % 2 == 0)
            .count();
        
        System.out.println("Çift sayı adedi: " + adet);
    }
}`,
          hints: [
            'filter ile çift olanları seç',
            'count() terminal operation',
            'long döner'
          ],
          expectedOutput: "Çift sayı adedi: 4"
        },
        {
          id: 'terminal-2',
          title: 'anyMatch() Kullanımı',
          description: '10\'dan büyük sayı var mı kontrol edin.',
          difficulty: '🟢',
          starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 5, 8, 12, 3);
        
        // TODO: anyMatch ile 10'dan büyük var mı kontrol edin
        
        System.out.println("10'dan büyük var mı? " + varMi);
    }
}`,
          solution: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 5, 8, 12, 3);
        
        boolean varMi = sayilar.stream()
            .anyMatch(n -> n > 10);
        
        System.out.println("10'dan büyük var mı? " + varMi);
    }
}`,
          hints: [
            'anyMatch(n -> n > 10)',
            'En az biri koşulu sağlarsa true',
            'boolean döner'
          ],
          expectedOutput: "10'dan büyük var mı? true"
        },
        {
          id: 'terminal-3',
          title: 'findFirst() Kullanımı',
          description: 'İlk çift sayıyı bulun.',
          difficulty: '🟡',
          starterCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 3, 5, 8, 10, 12);
        
        // TODO: İlk çift sayıyı bulun
        // Optional döner!
        
        ilkCift.ifPresent(n -> System.out.println("İlk çift: " + n));
    }
}`,
          solution: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> sayilar = Arrays.asList(1, 3, 5, 8, 10, 12);
        
        Optional<Integer> ilkCift = sayilar.stream()
            .filter(n -> n % 2 == 0)
            .findFirst();
        
        ilkCift.ifPresent(n -> System.out.println("İlk çift: " + n));
    }
}`,
          hints: [
            'filter ile çiftleri seç',
            'findFirst() ilkini bulur',
            'Optional döner, ifPresent kullan'
          ],
          expectedOutput: "İlk çift: 8"
        }
      ]
    },
    {
      id: 'grouping',
      title: '🗂️ Bölüm 17: groupingBy()',
      content: `<h3>groupingBy() - Gruplama</h3>
        <p>SQL'deki GROUP BY'a benzer. Elemanları bir kritere göre gruplar. Collectors'ın en güçlü metodlarından biridir.</p>
        <h4>Temel Kullanım:</h4>
        <pre>// Basit gruplama
Map&lt;Integer, List&lt;String&gt;&gt; gruplar = 
    liste.stream()
        .collect(Collectors.groupingBy(String::length));</pre>
        <h4>Downstream Collectors ile:</h4>
        <pre>// Gruplama + sayma
Map&lt;Integer, Long&gt; sayilar = 
    liste.stream()
        .collect(Collectors.groupingBy(
            String::length,
            Collectors.counting()
        ));

// Gruplama + toplama
Map&lt;String, Integer&gt; toplam = 
    liste.stream()
        .collect(Collectors.groupingBy(
            Person::getCity,
            Collectors.summingInt(Person::getAge)
        ));</pre>`,
      exercises: [
        {
          id: 'grouping-1',
          title: 'Uzunluğa Göre Gruplama',
          description: 'Kelimeleri uzunluklarına göre gruplayın.',
          difficulty: '🟡',
          starterCode: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<String> kelimeler = Arrays.asList("Java", "C", "Python", "Go", "JavaScript", "Rust");
        
        // TODO: Uzunluklarına göre gruplayın
        
        System.out.println(gruplar);
    }
}`,
          solution: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<String> kelimeler = Arrays.asList("Java", "C", "Python", "Go", "JavaScript", "Rust");
        
        Map<Integer, List<String>> gruplar = kelimeler.stream()
            .collect(Collectors.groupingBy(String::length));
        
        System.out.println(gruplar);
    }
}`,
          hints: [
            'groupingBy(String::length)',
            'Map<Integer, List<String>> döner',
            'Anahtar: uzunluk, değer: kelime listesi'
          ],
          expectedOutput: "{1=[C], 2=[Go], 4=[Java, Rust], 6=[Python], 10=[JavaScript]}"
        },
        {
          id: 'grouping-2',
          title: 'Gruplama ve Sayma',
          description: 'Kelimeleri uzunluklarına göre gruplayın ve her gruptaki kelime sayısını bulun.',
          difficulty: '🟡',
          starterCode: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<String> kelimeler = Arrays.asList("Java", "C", "Python", "Go", "JavaScript", "Rust", "Ruby");
        
        // TODO: groupingBy + counting kullanın
        
        System.out.println(sayilar);
    }
}`,
          solution: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<String> kelimeler = Arrays.asList("Java", "C", "Python", "Go", "JavaScript", "Rust", "Ruby");
        
        Map<Integer, Long> sayilar = kelimeler.stream()
            .collect(Collectors.groupingBy(
                String::length,
                Collectors.counting()
            ));
        
        System.out.println(sayilar);
    }
}`,
          hints: [
            'groupingBy ikinci parametre alabilir',
            'Collectors.counting() kaç tane olduğunu sayar',
            'Map<Integer, Long> döner'
          ],
          expectedOutput: "{1=1, 2=1, 4=3, 6=1, 10=1}"
        }
      ]
    },
    {
      id: 'parallel',
      title: '⚡ Bölüm 18: Parallel Streams',
      content: `<h3>Parallel Streams - Paralel İşleme</h3>
        <p>Çok çekirdekli işlemcilerin gücünden yararlanarak işlemleri paralel yapar. Büyük veri setlerinde önemli performans kazancı sağlar.</p>
        <h4>Parallel Stream Oluşturma:</h4>
        <pre>// Yöntem 1: parallelStream()
liste.parallelStream()

// Yöntem 2: sequential'den parallel'e
liste.stream().parallel()

// Parallel'den sequential'e geri dönüş
liste.parallelStream().sequential()</pre>
        <h4>Ne Zaman Kullanmalı:</h4>
        <ul>
          <li><strong>Büyük veri setleri:</strong> 10,000+ eleman</li>
          <li><strong>CPU-intensive işlemler:</strong> Ağır hesaplamalar</li>
          <li><strong>Stateless operasyonlar:</strong> Yan etki yok</li>
          <li><strong>Split'e uygun veri:</strong> ArrayList, Array</li>
        </ul>
        <h4>Dikkat Edilmesi Gerekenler:</h4>
        <pre>// ❌ Yan etki - Tehlikeli!
List&lt;Integer&gt; sonuc = new ArrayList&lt;&gt;();
liste.parallelStream()
    .forEach(sonuc::add); // Race condition!

// ✅ Doğru yol - Thread-safe
List&lt;Integer&gt; sonuc = liste.parallelStream()
    .collect(Collectors.toList());</pre>`,
      exercises: [
        {
          id: 'parallel-1',
          title: 'Parallel Stream Performans Testi',
          description: 'Aynı işlemi sequential ve parallel yaparak farkı gözlemleyin.',
          difficulty: '🟡',
          starterCode: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> buyukListe = IntStream.rangeClosed(1, 1000000)
            .boxed()
            .collect(Collectors.toList());
        
        // Sequential
        long start1 = System.currentTimeMillis();
        long seqSum = buyukListe.stream()
            .mapToLong(n -> n * n)
            .sum();
        long seqTime = System.currentTimeMillis() - start1;
        
        // TODO: Parallel ile aynı işlemi yapın
        
        System.out.println("Sequential: " + seqTime + "ms");
        System.out.println("Parallel: " + parTime + "ms");
        System.out.println("Hızlanma: " + (seqTime / (double)parTime) + "x");
    }
}`,
          solution: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> buyukListe = IntStream.rangeClosed(1, 1000000)
            .boxed()
            .collect(Collectors.toList());
        
        // Sequential
        long start1 = System.currentTimeMillis();
        long seqSum = buyukListe.stream()
            .mapToLong(n -> n * n)
            .sum();
        long seqTime = System.currentTimeMillis() - start1;
        
        // Parallel
        long start2 = System.currentTimeMillis();
        long parSum = buyukListe.parallelStream()
            .mapToLong(n -> n * n)
            .sum();
        long parTime = System.currentTimeMillis() - start2;
        
        System.out.println("Sequential: " + seqTime + "ms");
        System.out.println("Parallel: " + parTime + "ms");
        System.out.println("Hızlanma: " + (seqTime / (double)parTime) + "x");
    }
}`,
          hints: [
            'parallelStream() kullanın',
            'Aynı operasyonları yapın',
            'Süreyi karşılaştırın'
          ],
          expectedOutput: "Sequential: 150ms\nParallel: 50ms\nHızlanma: 3.0x"
        }
      ]
    },
    {
id: 'final',
      title: '🎓 Bölüm 19: Final Challenge',
      content: `<h3>Final Challenge - Tüm Bilgileri Birleştir!</h3>
        <p>Bu son bölümde, öğrendiğiniz tüm kavramları birleştirerek gerçek dünya problemlerini çözeceksiniz.</p>
        <h4>Öğrendiklerimiz:</h4>
        <ul>
          <li><strong>Lambda Expressions:</strong> Anonim fonksiyonlar</li>
          <li><strong>Functional Interfaces:</strong> Consumer, Predicate, Function, Supplier</li>
          <li><strong>Method References:</strong> Kısa ve temiz kod</li>
          <li><strong>Stream API:</strong> Declarative veri işleme</li>
          <li><strong>Intermediate Operations:</strong> filter, map, flatMap, distinct, sorted</li>
          <li><strong>Terminal Operations:</strong> collect, reduce, forEach, count, min, max</li>
          <li><strong>Collectors:</strong> toList, groupingBy, joining, reducing</li>
          <li><strong>Optional:</strong> Null-safe kodlama</li>
          <li><strong>Parallel Streams:</strong> Performans optimizasyonu</li>
        </ul>
        <h4>Best Practices:</h4>
        <pre>// ✅ İyi kod
liste.stream()
    .filter(Objects::nonNull)
    .filter(s -> s.length() > 3)
    .map(String::toUpperCase)
    .distinct()
    .sorted()
    .collect(Collectors.toList());

// ❌ Kötü kod
List result = new ArrayList();
for (Object o : liste) {
    if (o != null) {
        String s = (String) o;
        if (s.length() > 3) {
            result.add(s.toUpperCase());
        }
    }
}
Collections.sort(result);
return new ArrayList(new HashSet(result));</pre>`,
      exercises: [
        {
          id: 'final-1',
          title: 'E-Ticaret Analizi',
          description: 'Ürünleri kategoriye göre gruplayın, her kategoride ortalama fiyatı hesaplayın.',
          difficulty: '🔴',
          starterCode: `import java.util.*;
import java.util.stream.*;

class Product {
    String name;
    String category;
    double price;
    
    Product(String name, String category, double price) {
        this.name = name;
        this.category = category;
        this.price = price;
    }
    
    String getCategory() { return category; }
    double getPrice() { return price; }
}

public class Main {
    public static void main(String[] args) {
        List<Product> products = Arrays.asList(
            new Product("Laptop", "Electronics", 1500.0),
            new Product("Phone", "Electronics", 800.0),
            new Product("Shirt", "Clothing", 50.0),
            new Product("Shoes", "Clothing", 80.0),
            new Product("Book", "Education", 25.0),
            new Product("Notebook", "Education", 5.0)
        );
        
        // TODO: Kategoriye göre grupla ve ortalama fiyat hesapla
        
        avgPrices.forEach((category, avg) -> 
            System.out.println(category + ": $" + String.format("%.2f", avg))
        );
    }
}`,
          solution: `import java.util.*;
import java.util.stream.*;

class Product {
    String name;
    String category;
    double price;
    
    Product(String name, String category, double price) {
        this.name = name;
        this.category = category;
        this.price = price;
    }
    
    String getCategory() { return category; }
    double getPrice() { return price; }
}

public class Main {
    public static void main(String[] args) {
        List<Product> products = Arrays.asList(
            new Product("Laptop", "Electronics", 1500.0),
            new Product("Phone", "Electronics", 800.0),
            new Product("Shirt", "Clothing", 50.0),
            new Product("Shoes", "Clothing", 80.0),
            new Product("Book", "Education", 25.0),
            new Product("Notebook", "Education", 5.0)
        );
        
        Map<String, Double> avgPrices = products.stream()
            .collect(Collectors.groupingBy(
                Product::getCategory,
                Collectors.averagingDouble(Product::getPrice)
            ));
        
        avgPrices.forEach((category, avg) -> 
            System.out.println(category + ": $" + String.format("%.2f", avg))
        );
    }
}`,
          hints: [
            'groupingBy(Product::getCategory, ...)',
            'Collectors.averagingDouble(Product::getPrice)',
            'Map<String, Double> döner'
          ],
          expectedOutput: "Electronics: $1150.00\nClothing: $65.00\nEducation: $15.00"
        },
        {
          id: 'final-2',
          title: 'Öğrenci Başarı Analizi',
          description: 'En yüksek 3 notu bulun, ortalamaları hesaplayın ve başarılı öğrenci sayısını bulun.',
          difficulty: '🔴',
          starterCode: `import java.util.*;
import java.util.stream.*;

class Student {
    String name;
    double grade;
    
    Student(String name, double grade) {
        this.name = name;
        this.grade = grade;
    }
    
    String getName() { return name; }
    double getGrade() { return grade; }
}

public class Main {
    public static void main(String[] args) {
        List<Student> students = Arrays.asList(
            new Student("Ali", 85.5),
            new Student("Ayşe", 92.0),
            new Student("Mehmet", 78.0),
            new Student("Fatma", 95.5),
            new Student("Ahmet", 88.0),
            new Student("Zeynep", 91.5)
        );
        
        // TODO: 1) En yüksek 3 notu bulun
        // TODO: 2) Ortalama hesaplayın
        // TODO: 3) 85+ kaç öğrenci var?
        
        System.out.println("En yüksek 3 not:");
        top3.forEach(s -> System.out.println(s.getName() + ": " + s.getGrade()));
        
        System.out.println("\\nOrtalama: " + String.format("%.2f", avg));
        System.out.println("85+ öğrenci sayısı: " + successCount);
    }
}`,
          solution: `import java.util.*;
import java.util.stream.*;

class Student {
    String name;
    double grade;
    
    Student(String name, double grade) {
        this.name = name;
        this.grade = grade;
    }
    
    String getName() { return name; }
    double getGrade() { return grade; }
}

public class Main {
    public static void main(String[] args) {
        List<Student> students = Arrays.asList(
            new Student("Ali", 85.5),
            new Student("Ayşe", 92.0),
            new Student("Mehmet", 78.0),
            new Student("Fatma", 95.5),
            new Student("Ahmet", 88.0),
            new Student("Zeynep", 91.5)
        );
        
        List<Student> top3 = students.stream()
            .sorted(Comparator.comparing(Student::getGrade).reversed())
            .limit(3)
            .collect(Collectors.toList());
        
        double avg = students.stream()
            .mapToDouble(Student::getGrade)
            .average()
            .orElse(0.0);
        
        long successCount = students.stream()
            .filter(s -> s.getGrade() >= 85.0)
            .count();
        
        System.out.println("En yüksek 3 not:");
        top3.forEach(s -> System.out.println(s.getName() + ": " + s.getGrade()));
        
        System.out.println("\\nOrtalama: " + String.format("%.2f", avg));
        System.out.println("85+ öğrenci sayısı: " + successCount);
    }
}`,
          hints: [
            'sorted + reversed + limit(3)',
            'mapToDouble + average',
            'filter + count'
          ],
          expectedOutput: "En yüksek 3 not:\nFatma: 95.5\nAyşe: 92.0\nZeynep: 91.5\n\nOrtalama: 88.42\n85+ öğrenci sayısı: 5"
        },
        {
          id: 'final-3',
          title: 'Master Challenge - Tam Pipeline',
          description: 'Kelimeleri filtreleyin, dönüştürün, gruplayın ve analiz edin.',
          difficulty: '🔴',
          starterCode: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<String> words = Arrays.asList(
            "Java", "Python", "JavaScript", "C++", 
            "Ruby", "Go", "Rust", "Swift", "Kotlin"
        );
        
        // TODO: Pipeline oluşturun:
        // 1) 4 harften uzun olanları filtrele
        // 2) Büyük harfe çevir
        // 3) İlk harfe göre grupla
        // 4) Her grupta kaç kelime var?
        
        result.forEach((letter, count) -> 
            System.out.println(letter + ": " + count + " kelime")
        );
    }
}`,
          solution: `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<String> words = Arrays.asList(
            "Java", "Python", "JavaScript", "C++", 
            "Ruby", "Go", "Rust", "Swift", "Kotlin"
        );
        
        Map<Character, Long> result = words.stream()
            .filter(w -> w.length() > 4)
            .map(String::toUpperCase)
            .collect(Collectors.groupingBy(
                w -> w.charAt(0),
                Collectors.counting()
            ));
        
        result.forEach((letter, count) -> 
            System.out.println(letter + ": " + count + " kelime")
        );
    }
}`,
          hints: [
            'filter(w -> w.length() > 4)',
            'map(String::toUpperCase)',
            'groupingBy(w -> w.charAt(0), counting())',
            'Map<Character, Long> döner'
          ],
          expectedOutput: "P: 1 kelime\nJ: 2 kelime\nK: 1 kelime\nS: 1 kelime"
        }
      ]
    }
  ];

  const totalExercises = sections.reduce((sum, s) => sum + (s.exercises?.length || 0), 0);

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <button className="icon-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1>☕ Java Lambda & Stream Rehberi</h1>
        </div>
        <div className="header-stats">
          <span className="stat">
            {solvedCount === totalExercises ? <Trophy size={16} color="#FFD700" /> : <Award size={16} />}
            {solvedCount}/{totalExercises} Alıştırma
          </span>
          <button className="icon-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <div className="container">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav>
            {sections.map((s, i) => (
              <button key={s.id} className={`nav-item ${activeSection === i ? 'active' : ''}`} onClick={() => setActiveSection(i)}>
                <BookOpen size={16} /><span>{s.title}</span>
              </button>
            ))}
          </nav>
          <div className="progress">
            <span>Bölüm İlerlemesi</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${((activeSection + 1) / sections.length) * 100}%` }} />
            </div>
            <span>{activeSection + 1} / {sections.length}</span>
          </div>
        </aside>

        <main className="content">
          <h2>{sections[activeSection].title}</h2>
          <div dangerouslySetInnerHTML={{ __html: sections[activeSection].content }} />
          
          {sections[activeSection].exercises?.length > 0 && (
            <div className="exercises">
              <h3>📝 Pratik Alıştırmalar</h3>
              <p className="exercises-intro">Öğrendiklerinizi pekiştirmek için bu alıştırmaları çözün. Her doğru çözüm kaydedilir ve ilerlemeniz takip edilir.</p>
              {sections[activeSection].exercises.map((ex, i) => (
                <Exercise 
                  key={ex.id} 
                  {...ex} 
                  exerciseId={ex.id}
                  onSolve={() => setSolvedCount(prev => prev + 1)}
                />
              ))}
            </div>
          )}

          <div className="nav-buttons">
            {activeSection > 0 && (
              <button onClick={() => setActiveSection(activeSection - 1)} className="nav-btn prev">← Önceki</button>
            )}
            {activeSection < sections.length - 1 && (
              <button onClick={() => setActiveSection(activeSection + 1)} className="nav-btn next">Sonraki →</button>
            )}
            {activeSection === sections.length - 1 && (
              <div className="completion-message">
                <h3>🎉 Tebrikler!</h3>
                <p>Java Lambda ve Stream API eğitimini tamamladınız!</p>
                <p>Çözdüğünüz alıştırma sayısı: <strong>{solvedCount}/{totalExercises}</strong></p>
                {solvedCount === totalExercises && (
                  <div className="trophy-message">
                    <Trophy size={48} color="#FFD700" />
                    <p style={{marginTop: '20px', fontSize: '18px', fontWeight: 'bold'}}>
                      Tüm alıştırmaları başarıyla tamamladınız! 🏆
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root[data-theme="dark"] {
          --bg-1: #0d1117; --bg-2: #161b22; --bg-3: #21262d; --bg-hover: #30363d;
          --text-1: #e6edf3; --text-2: #8b949e; --border: #30363d;
          --accent: #58a6ff; --accent-hover: #1f6feb;
          --success: #3fb950; --error: #f85149; --warning: #d29922;
        }
        :root[data-theme="light"] {
          --bg-1: #fff; --bg-2: #f6f8fa; --bg-3: #f0f0f0; --bg-hover: #e8e8e8;
          --text-1: #24292f; --text-2: #57606a; --border: #d0d7de;
          --accent: #0969da; --accent-hover: #0550ae;
          --success: #1a7f37; --error: #cf222e; --warning: #bf8700;
        }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .app { min-height: 100vh; background: var(--bg-1); color: var(--text-1); }
        .header { height: 60px; background: var(--bg-2); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; position: sticky; top: 0; z-index: 100; }
        .header-left { display: flex; align-items: center; gap: 15px; }
        .header h1 { font-size: 18px; font-weight: 600; }
        .header-stats { display: flex; align-items: center; gap: 15px; }
        .stat { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-2); font-weight: 500; }
        .icon-btn { background: transparent; border: none; color: var(--text-1); cursor: pointer; padding: 8px; border-radius: 6px; display: flex; align-items: center; transition: background 0.2s; }
        .icon-btn:hover { background: var(--bg-hover); }
        .container { display: flex; height: calc(100vh - 60px); }
        .sidebar { width: 280px; background: var(--bg-2); border-right: 1px solid var(--border); overflow-y: auto; transition: transform 0.3s; display: flex; flex-direction: column; }
        .sidebar:not(.open) { transform: translateX(-100%); }
        nav { flex: 1; padding: 20px 10px; }
        .nav-item { width: 100%; padding: 12px 16px; background: transparent; border: none; color: var(--text-2); text-align: left; cursor: pointer; border-radius: 6px; margin-bottom: 4px; display: flex; align-items: center; gap: 10px; font-size: 14px; transition: all 0.2s; }
        .nav-item:hover { background: var(--bg-hover); color: var(--text-1); }
        .nav-item.active { background: var(--accent); color: white; }
        .progress { padding: 20px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px; }
        .progress > span { font-size: 12px; color: var(--text-2); font-weight: 500; }
        .progress-bar { height: 8px; background: var(--bg-3); border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--accent); transition: width 0.3s; }
        .content { flex: 1; overflow-y: auto; padding: 40px; max-width: 1200px; margin: 0 auto; }
        .content h2 { font-size: 28px; margin-bottom: 20px; }
        .content h3 { margin: 24px 0 12px; font-size: 20px; }
        .content h4 { margin: 20px 0 10px; font-size: 17px; color: var(--text-2); }
        .content p { margin-bottom: 16px; line-height: 1.7; }
        .content ul { margin: 16px 0 16px 24px; }
        .content li { margin-bottom: 8px; line-height: 1.6; }
        .content pre { background: var(--bg-2); padding: 16px; border-radius: 6px; border: 1px solid var(--border); margin: 16px 0; overflow-x: auto; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.5; }
        .exercises { margin-top: 50px; }
        .exercises h3 { margin-bottom: 12px; font-size: 22px; }
        .exercises-intro { color: var(--text-2); font-size: 14px; margin-bottom: 24px; padding: 14px; background: var(--bg-2); border-radius: 6px; border-left: 3px solid var(--accent); line-height: 1.6; }
        .exercise { background: var(--bg-2); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 16px; overflow: hidden; transition: all 0.3s; }
        .exercise.solved { border-color: var(--success); box-shadow: 0 0 0 1px var(--success); }
        .ex-header { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.2s; }
        .ex-header:hover { background: var(--bg-hover); }
        .ex-title { display: flex; align-items: center; gap: 10px; flex: 1; }
        .ex-title h4 { font-size: 16px; font-weight: 500; margin: 0; }
        .difficulty { font-size: 18px; }
        .expand-btn { background: transparent; border: none; color: var(--text-1); font-size: 24px; cursor: pointer; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: background 0.2s; font-weight: 300; }
        .expand-btn:hover { background: var(--bg-hover); }
        .ex-content { padding: 0 20px 20px; animation: slideDown 0.3s ease; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .ex-description { margin-bottom: 20px; }
        .ex-description p { color: var(--text-2); line-height: 1.6; margin: 0; }
        .expected-info { margin-top: 12px; padding: 12px; background: var(--bg-3); border-radius: 6px; font-size: 14px; border-left: 3px solid var(--accent); }
        .expected-info strong { display: block; margin-bottom: 8px; color: var(--accent); }
        .expected-info pre { margin: 0; padding: 8px; background: var(--bg-1); border-radius: 4px; font-size: 13px; border: 1px solid var(--border); }
        .ex-controls { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .hint-btn, .solution-btn { padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .hint-btn { background: var(--warning); color: white; border: none; }
        .hint-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .hint-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .solution-btn { background: var(--bg-3); color: var(--text-1); border: 1px solid var(--border); }
        .solution-btn:hover { background: var(--bg-hover); }
        .hints { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .hint { padding: 12px 16px; background: #fff3cd; color: #856404; border-radius: 6px; border-left: 3px solid var(--warning); font-size: 14px; line-height: 1.5; display: flex; gap: 8px; }
        [data-theme="dark"] .hint { background: rgba(210, 153, 34, 0.15); color: #f0ad4e; }
        .hint-number { font-weight: 600; flex-shrink: 0; }
        .code-section h5, .solution-section h5 { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: var(--text-1); }
        .solution-section { margin-top: 24px; padding-top: 24px; border-top: 2px dashed var(--border); animation: slideDown 0.3s ease; }
        .code-editor { background: var(--bg-2); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .editor-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--bg-3); border-bottom: 1px solid var(--border); }
        .editor-header span { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: var(--text-2); }
        .actions { display: flex; gap: 8px; }
        .run-btn { background: var(--accent); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; transition: all 0.2s; }
        .run-btn:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); box-shadow: 0 2px 8px rgba(88, 166, 255, 0.3); }
        .run-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .code-area { width: 100%; min-height: 250px; max-height: 500px; padding: 16px; background: var(--bg-2); color: var(--text-1); border: none; font-family: 'Courier New', 'Consolas', monospace; font-size: 14px; line-height: 1.6; resize: vertical; outline: none; }
        .code-area:focus { background: var(--bg-1); }
        .output-panel { border-top: 1px solid var(--border); animation: slideDown 0.2s ease; }
        .output-header { padding: 10px 16px; background: var(--bg-3); font-size: 12px; font-weight: 600; color: var(--text-2); display: flex; justify-content: space-between; align-items: center; }
        .status { font-size: 13px; font-weight: 600; padding: 4px 8px; border-radius: 4px; }
        .status.correct { color: var(--success); background: rgba(63, 185, 80, 0.1); }
        .status.incorrect { color: var(--error); background: rgba(248, 81, 73, 0.1); }
        .output-content { padding: 16px; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.5; white-space: pre-wrap; max-height: 300px; overflow-y: auto; background: var(--bg-1); }
        .expected-output { padding: 16px; background: rgba(248, 81, 73, 0.05); border-top: 1px solid var(--border); }
        .expected-output strong { display: block; margin-bottom: 8px; color: var(--error); font-size: 12px; }
        .expected-output pre { margin: 0; padding: 12px; background: var(--bg-2); border-radius: 4px; font-size: 13px; border: 1px solid var(--border); }
        .nav-buttons { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 30px; border-top: 1px solid var(--border); }
        .nav-btn { padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
        .nav-btn.next { background: var(--accent); color: white; border: none; }
        .nav-btn.next:hover { background: var(--accent-hover); transform: translateX(2px); }
        .nav-btn.prev { background: var(--bg-2); color: var(--text-1); border: 1px solid var(--border); }
        .nav-btn.prev:hover { background: var(--bg-hover); transform: translateX(-2px); }
        .completion-message { text-align: center; padding: 40px; background: var(--bg-2); border-radius: 12px; margin-top: 20px; }
        .completion-message h3 { font-size: 28px; margin-bottom: 16px; color: var(--accent); }
        .completion-message p { font-size: 16px; line-height: 1.6; color: var(--text-2); }
        .trophy-message { margin-top: 30px; padding: 30px; background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05)); border-radius: 12px; border: 2px solid rgba(255, 215, 0, 0.3); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: var(--bg-2); }
        ::-webkit-scrollbar-thumb { background: var(--bg-hover); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--border); }
        
        @media (max-width: 768px) {
          .sidebar { position: fixed; left: 0; top: 60px; height: calc(100vh - 60px); z-index: 50; box-shadow: 2px 0 8px rgba(0,0,0,0.1); }
          .content { padding: 20px; }
          .header h1 { font-size: 14px; }
          .header-stats .stat span { display: none; }
          .ex-controls { flex-direction: column; }
          .hint-btn, .solution-btn { width: 100%; justify-content: center; }
          .code-area { font-size: 13px; min-height: 200px; }
          .nav-buttons { flex-direction: column; gap: 12px; }
          .nav-btn { width: 100%; justify-content: center; }
        }
        
        @media print {
          .sidebar, .header, .nav-buttons, .ex-controls { display: none; }
          .content { padding: 20px; max-width: 100%; }
          .code-editor { break-inside: avoid; }
        }
        
        button:focus-visible, .code-area:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes celebration {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .exercise.solved .ex-title {
          animation: celebration 0.5s ease;
        }
        
        [title] {
          position: relative;
          cursor: help;
        }
        
        .code-area {
          tab-size: 4;
          -moz-tab-size: 4;
        }
        
        .nav-item:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: -2px;
        }
        
        * {
          transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }
        
        button, .code-area, .nav-item {
          transition: all 0.2s ease;
        }
        
        .header {
          backdrop-filter: blur(10px);
          background: rgba(22, 27, 34, 0.95);
        }
        
        [data-theme="light"] .header {
          background: rgba(255, 255, 255, 0.95);
        }
        
        .stat svg[color="#FFD700"] {
          filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.5));
          animation: pulse 2s infinite;
        }
        
        .exercise:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        [data-theme="dark"] .exercise:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}