import 'package:flutter/cupertino.dart';
import 'package:pocketbase/pocketbase.dart';

class PBProvider extends InheritedWidget {
  final PocketBase pb;

  const PBProvider({super.key, required this.pb, required super.child});

  static PBProvider? of(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<PBProvider>();
  }

  @override
  bool updateShouldNotify(PBProvider oldWidget) => pb != oldWidget.pb;
}
