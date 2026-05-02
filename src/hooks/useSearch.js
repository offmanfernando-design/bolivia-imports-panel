import { useEffect, useState } from "react";
import { API_URL } from "../config/api";

export default function useSearch(query) {

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {

      try {

        setLoading(true);

        const res = await fetch(
          `${API_URL}/operativo/buscar?q=${encodeURIComponent(query)}`
        );

        const data = await res.json();

        if (data.ok) {
          setResults(data.data);
        }

      } catch (err) {
        console.error("Error búsqueda:", err);
      } finally {
        setLoading(false);
      }

    }, 300); // debounce

    return () => clearTimeout(delay);

  }, [query]);

  return { results, loading };

}